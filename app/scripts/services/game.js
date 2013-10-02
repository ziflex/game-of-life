"use strict";
angular.module('gol.services', ['gol.factories', 'gol.constants'])
    .service('$game', function($models, $gameStatus, $commonEvents, $gameEvents, $cellGens) {
        /// <summary>
        /// Private properties
        /// </summary>
        var _xMax = 0,
            _yMax = 0,
            _status = $gameStatus.stopped,
            _eventEmitter = $models.create_eventEmitter(),
            _pool = [], // cells pool
            _map = {}, // cells gen map
            _changes = false; // cells changes per cycle

        // add some 'collection magic' to objects
        if (!Object.prototype.each) {
            Object.prototype.each = function(callback){
                var prop;

                for (prop in this) {
                    if(this[prop] && this.hasOwnProperty(prop) && typeof (this[prop]) !== 'function'){
                        callback(this[prop]);
                    }
                }
            };
        }

        /// <summary>
        /// Private methods
        /// </summary>
        var _eachCell = function (callback, from, where) {
                var func = function (collection) {
                    collection.each(function(el){
                        var isValid = true;
                        if (where && typeof where === 'function'){
                            isValid = where(el);
                        }

                        if (isValid) {
                            callback(el);
                        }
                    });
                };

                if (!callback) {
                    return;
                }

                if (from && _map[from]){
                    func(_map[from]);
                } else {
                    _map.each(func);
                }
            },
            _findCell = function (coordinates, from) {
                var result;

                if (from && _map[from]){
                    result = _map[from].get(coordinates.x, coordinates.y);
                } else {
                    _map.each(function (g) {
                        if (!result) {
                            result = g.get(coordinates.x, coordinates.y);
                        }
                    })
                }

                return result;
        },
            _moveCell = function (cell, from, to) {
                var f = _map[from],
                    t = _map[to];

                if(f && t){
                    if (f.contains(cell)){
                        f.remove(cell);
                        t.add(cell);
                    }
                }
            },
            _findNeighbors = function (cell) {
                var prop,
                    neighbor,
                    result = [],
                    offsets = [
                        {x: -1, y: 0},
                        {x: -1, y: 1},
                        {x: -1, y: -1},
                        {x: 0, y: 1},
                        {x: 0, y: -1},
                        {x: 1, y: 0},
                        {x: 1, y: 1},
                        {x: 1, y: -1}],

                    getNeighborCoordinates = function (offset) {
                        var x, y;

                        x = cell.x() + offset.x;
                        y = cell.y() + offset.y;

                        if (x < 0) {
                            x = _xMax;
                        }

                        if (y < 0) {
                            y = _yMax;
                        }

                        return {x : x, y: y};
                    };

                offsets.each(function(offset){
                    // get only live cells and not of the current generation
                    neighbor = _findCell(getNeighborCoordinates(offset), $cellGens.old);

                    if (neighbor) {
                        result.push(neighbor);
                    }
                });

                return result;
            },
            _continue = function () {
                return (_map[$cellGens.young].count() > 0 || _map[$cellGens.old].count() > 0) && _changes;
            },
            _populate = function (xMax, yMax) {
                var x,
                    y,
                    i = 0,
                    cell;

                for (x = 0; x < xMax; x += 1) {
                    for (y = 0; y < yMax; y += 1) {
                        i += 1;
                        if (_pool.length < i) {
                            cell = $models.create_Cell(x, y);
                            cell.on($commonEvents.changed, _onCellChange);
                            _pool.push(cell);
                        }

                        _map[$cellGens.none].add(_pool[i-1]);
                    }
                }
            },
            _free = function (from) {
                if (from && _map[from]){
                    _map[from].clear();
                } else {
                    _map.each(function(g) {
                        g.clear();
                    })
                }
            },
            _lifeCycle = function (callback) {
                var func = function (el) {
                    callback(el, _findNeighbors(el));
                };

                // update young generation
                _eachCell(function (el){
                    el.persist();
                }, $cellGens.young);

                _free($cellGens.young);

                // hides cells migration
                _map.each(function(m){
                    m.beginTransaction();
                });

                _changes = false;

                _eachCell(func, $cellGens.old);
                _eachCell(func, $cellGens.none);

                // complete cells migration
                _map.each(function(m){
                    m.commitTransaction();
                });
            },
            _onCellChange = function (eventName, options) {
                if (!options || _status === $gameStatus.stopped) {
                    return;
                }

                _changes = true;

                switch(options.to) {
                    case $cellGens.none:
                        _eventEmitter.fire($gameEvents.onCellDead, { event: $gameEvents.onCellDead, coordinates: {x: options.cell.x(), y: options.cell.y()} });
                        break;
                    case $cellGens.young:
                        _eventEmitter.fire($gameEvents.onCellAlive, { event: $gameEvents.onCellAlive, coordinates: {x: options.cell.x(), y: options.cell.y()} });
                        break;
                    case $cellGens.old:
                        break;
                    default:
                        break;
                }

                _moveCell(options.cell, options.from, options.to);
            };

        _map[$cellGens.none] = $models.create_cellCollection();
        _map[$cellGens.young] = $models.create_cellCollection();
        _map[$cellGens.old] = $models.create_cellCollection();

        this.start = function (options) {
            _status = $gameStatus.started;
            _eventEmitter.fire($gameEvents.onStart);

            _xMax = options.xMax;
            _yMax = options.yMax;

            // fill collections
            _populate(options.xMax, options.yMax);

            // starting cells
            options.selected.each(function(coordinates) {
                _findCell(coordinates, $cellGens.none).born();
            });

            // cells life cycle
            while(_continue()) {
                _lifeCycle(function(cell, neighbors){
                    neighbors = neighbors || [];

                    if (cell.isAlive()) {
                        // if cell has less than 2 or more then 3 neighbor - it dies.
                        if (neighbors.length < 2 || neighbors.length > 3) {
                            cell.kill();
                        }
                    } else {
                        // if cell has 3 neighbors - it gets alive.
                        if (neighbors.length === 3) {
                            cell.born();
                        }
                    }
                });
            }

            this.stop();
        };

        this.stop = function () {
            _status = $gameStatus.stopped;
            _free();

            _pool.each(function(c){
                c.kill();
            });

            _eventEmitter.fire($gameEvents.onStop);
        };

        this.get_status = function () {
            return _status;
        };

        this.on = function (eventName, handler) {
            _eventEmitter.on(eventName, handler);
        };

        this.off = function (eventName, handler) {
            _eventEmitter.off(eventName, handler);
        }
    });