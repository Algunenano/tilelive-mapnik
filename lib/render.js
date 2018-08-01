const mapnik = require('@carto/mapnik');
const mime = require('mime');

const MapnikSource = require('./mapnik_backend');

const EARTH_RADIUS = 6378137;
const EARTH_DIAMETER = EARTH_RADIUS * 2;
const EARTH_CIRCUMFERENCE = EARTH_DIAMETER * Math.PI;
const MAX_RES = EARTH_CIRCUMFERENCE / 256;
const ORIGIN_SHIFT = EARTH_CIRCUMFERENCE/2;


exports['calculateMetatile'] = calculateMetatile;
function calculateMetatile(options) {
    var z = +options.z, x = +options.x, y = +options.y;
    var total = Math.pow(2, z);
    var resolution = MAX_RES / total;

    // Make sure we start at a metatile boundary.
    x -= x % options.metatile;
    y -= y % options.metatile;

    // Make sure we don't calculcate a metatile that is larger than the bounds.
    var metaWidth  = Math.min(options.metatile, total, total - x);
    var metaHeight = Math.min(options.metatile, total, total - y);

    // Generate all tile coordinates that are within the metatile.
    var tiles = [];
    for (var dx = 0; dx < metaWidth; dx++) {
        for (var dy = 0; dy < metaHeight; dy++) {
            tiles.push([ z, x + dx, y + dy ]);
        }
    }

    var minx = (x * 256) * resolution - ORIGIN_SHIFT;
    var miny = -((y + metaHeight) * 256) * resolution + ORIGIN_SHIFT;
    var maxx = ((x + metaWidth) * 256) * resolution - ORIGIN_SHIFT;
    var maxy = -((y * 256) * resolution - ORIGIN_SHIFT);
    return {
        width: metaWidth * options.tileSize,
        height: metaHeight * options.tileSize,
        x: x, y: y,
        tiles: tiles,
        bbox: [ minx, miny, maxx, maxy ]
    };
}

exports['sliceMetatile'] = sliceMetatile;
function sliceMetatile(source, source_image, options, meta, stats, callback) {
    const tiles_length = meta.tiles.length;
    if (tiles_length === 0) {
        callback(null, {});
    }

    const tiles = {};
    const err_num = 0;
    let tile_num = 0;

    meta.tiles.forEach(c => {
        const key = [options.format, c[0], c[1], c[2]].join(',');
        const encodeStartTime = Date.now();
        const x = (c[1] - meta.x) * options.tileSize;
        const y = (c[2] - meta.y) * options.tileSize;
        getImage(source, source_image, options, x, y, (err, image) => {
            tile_num++;
            if (err) {
                if (!err_num) return callback(err);
                err_num++;
            } else {
                const stats_tile = Object.assign(
                        stats,
                        { encode: Date.now() - encodeStartTime },
                        source_image.get_metrics());
                const tile = {
                    image: image,
                    headers: options.headers,
                    stats: stats_tile
                };
                tiles[key] = tile;
                if (tile_num === tiles_length) {
                    return callback(null, tiles);
                }
            }
        });
    });
}

exports['encodeSingleTile'] = encodeSingleTile;
function encodeSingleTile(source, source_image, options, meta, stats, callback) {
    var tiles = {};
    var key = [options.format, options.z, options.x, options.y].join(',');
    var encodeStartTime = Date.now();
    getImage(source, source_image, options, 0, 0, function(err, image) {
        if (err) return callback(err);
        stats.encode = Date.now() - encodeStartTime;
        stats = Object.assign(stats, source_image.get_metrics());
        tiles[key] = { image: image, headers: options.headers, stats: stats };
        callback(null, tiles);
    });
}

function getImage(source, image, options, x, y, callback) {
    var view = image.view(x, y, options.tileSize, options.tileSize);
    view.isSolid(function(err, solid, pixel) {
        if (err) return callback(err);
        var pixel_key = '';
        if (solid) {
            if (options.format === 'utf') {
                // TODO https://github.com/mapbox/tilelive-mapnik/issues/56
                pixel_key = pixel.toString();
            } else {
                // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Bitwise_Operators
                var a = (pixel>>>24) & 0xff;
                var r = pixel & 0xff;
                var g = (pixel>>>8) & 0xff;
                var b = (pixel>>>16) & 0xff;
                pixel_key = options.format + r +','+ g + ',' + b + ',' + a;
            }
        }
        // Add stats.
        options.source._stats.total++;
        if (solid !== false) options.source._stats.solid++;
        if (solid !== false && image.painted()) options.source._stats.solidPainted++;
        // If solid and image buffer is cached skip image encoding.
        if (solid && source.solidCache[pixel_key]) return callback(null, source.solidCache[pixel_key]);
        // Note: the second parameter is needed for grid encoding.
        options.source._stats.encoded++;
        try {
            function encodeCallback (err, buffer) {
                if (err) {
                    return callback(err);
                }
                if (solid !== false) {
                    // @TODO for 'utf' this attaches an extra, bogus 'solid' key to
                    // to the grid as it is not a buffer but an actual JS object.
                    // Fix is to propagate a third parameter through callbacks all
                    // the way back to tilelive source #getGrid.
                    buffer.solid = pixel_key;
                    if (options.format !== 'utf') {
                        source.solidCache[pixel_key] = buffer;
                    }
                }
                return callback(null, buffer);
            }

            if (options.format == 'utf') {
                view.encode(options, encodeCallback);
            } else {
                view.encode(options.format, options, encodeCallback);
            }
        } catch (err) {
            return callback(err);
        }
    });
}

// Render png/jpg/tif image or a utf grid and return an encoded buffer
MapnikSource.prototype._renderMetatile = function(options, callback) {
    var source = this;

    // Calculate bbox from xyz, respecting metatile settings.
    var meta = calculateMetatile(options);

    // Set default options.
    if (options.format === 'utf') {
        options.layer = source._info.interactivity_layer;
        options.fields = source._info.interactivity_fields;
        options.resolution = source._uri.query.resolution;
        options.headers = { 'Content-Type': 'application/json' };
        var image = new mapnik.Grid(meta.width, meta.height);
    } else {
        // NOTE: formats use mapnik syntax like `png8:m=h` or `jpeg80`
        // so we need custom handling for png/jpeg
        if (options.format.indexOf('png') != -1) {
            options.headers = { 'Content-Type': 'image/png' };
        } else if (options.format.indexOf('jpeg') != -1 ||
                   options.format.indexOf('jpg') != -1) {
            options.headers = { 'Content-Type': 'image/jpeg' };
        } else {
            // will default to 'application/octet-stream' if unable to detect
            options.headers = { 'Content-Type': mime.getType(options.format.split(':')[0]) };
        }
        var image = new mapnik.Image(meta.width, meta.height);
    }
    image.metrics_enabled = options.metrics || false;

    options.variables = options.variables || {};
    options.scale = +source._uri.query.scale;

    // Add reference to the source allowing debug/stat reporting to be compiled.
    options.source = source;

    const mapPromise = this._pool.acquire()
    .then((map) => {
        if (map instanceof Error) {
            this._pool.release(map);
            return callback(map);
        }

        // Begin at metatile boundary.
        options.x = meta.x;
        options.y = meta.y;
        options.variables.zoom = options.z;
        map.resize(meta.width, meta.height);
        map.extent = meta.bbox;
        try {
            source._stats.render++;
            var renderStats = {};
            var renderStartTime = Date.now();
            map.render(image, options, (err, image) => {
                this._pool.release(map);
                if (err) {
                    return callback(err);
                }
                if (meta.tiles.length > 1) {
                    renderStats.render = Math.round((Date.now() - renderStartTime) / meta.tiles.length);
                    sliceMetatile(source, image, options, meta, renderStats, callback);
                } else {
                    renderStats.render = Date.now() - renderStartTime;
                    encodeSingleTile(source, image, options, meta, renderStats, callback);
                }
            });
        } catch(err) {
            this._pool.release(map);
            return callback(err);
        }
    })
    .catch(err => callback(err));

    // Return a list of all the tile coordinates that are being rendered
    // as part of this metatile.
    return meta.tiles.map(function(tile) {
        return options.format + ',' + tile.join(',');
    });
};
