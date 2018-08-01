# tilelive-mapnik changelog

## 0.6.18-cdb15
* Update @carto/mapnik to [`3.6.2-carto.11`](https://github.com/CartoDB/node-mapnik/blob/v3.6.2-carto.11/CHANGELOG.carto.md#362-carto11).
* Dev: Set mocha dependency to `5.2.0`.
* Update `generic-pool` to `3.4.2`.
* Remove `step` and calls to `nextTick`.
* Remove unused `sphericalmercator`.

## 0.6.18-cdb14
* Set @carto/mapnik to [`3.6.2-carto.10`](https://github.com/CartoDB/node-mapnik/blob/v3.6.2-carto/CHANGELOG.carto.md#362-carto10)

## 0.6.18-cdb13
* Set @carto/mapnik to [`3.6.2-carto.9`](https://github.com/CartoDB/node-mapnik/blob/v3.6.2-carto/CHANGELOG.carto.md#362-carto9)

## 0.6.18-cdb12
* Set @carto/mapnik to [`3.6.2-carto.8`](https://github.com/CartoDB/node-mapnik/blob/v3.6.2-carto/CHANGELOG.carto.md#362-carto8)

## 0.6.18-cdb11
* Add support for render time variables
* Return Mapnik metrics with metatiles

## 0.6.18-cdb10
* Set @carto/mapnik to [`3.6.2-carto.7`](https://github.com/CartoDB/node-mapnik/blob/v3.6.2-carto/CHANGELOG.carto.md#362-carto7)

## 0.6.18-cdb9
* Set @carto/mapnik to [`3.6.2-carto.6`](https://github.com/CartoDB/node-mapnik/blob/v3.6.2-carto/CHANGELOG.carto.md#362-carto6)

## 0.6.18-cdb8
* Set @carto/mapnik to `3.6.2-carto.4`, which includes improvements for the cache for raster symbols. See the [changelog](https://github.com/CartoDB/node-mapnik/blob/v3.6.2-carto/CHANGELOG.carto.md#362-carto4)

## 0.6.18-cdb7
* Revert module updates from 0.6.18-cdb6
* Set @carto/mapnik to `3.6.2-carto.2`

## 0.6.18-cdb6

* Remove unused module `sphericalmercator`
* Point CI tags to our forks
* Update step to `1.0.0`
* Update @carto/mapnik to `3.6.2-carto.3`
* Update mime to `2.2.0`
* Update generic-pool to `2.5.4`

## 0.6.18-cdb5

* Enable support to capture mapnik metrics (grid, image)

## 0.6.18-cdb4

* Upgrade mapnik to @carto/mapnik ~3.6.2-carto.0

## 0.6.18-cdb3

* Be able to configure tile timeout.

## 0.6.18-cdb2

* Allow to configure buffer-size to 0

## 0.6.x-cdb

* Support zoom > 30
* Exposes LockingCache configuration to adjust ttl and expire policy
