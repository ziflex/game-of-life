"use strict";
angular.module('gol.services', ['gol.factories', 'gol.constants'])
    .service('$game', function($models, $gameStatus, $commonEvents, $gameEvents, $cellGens) {
        ///<summary> Private properties </summary>

        var _xMax = 0,
            _yMax = 0,
            _status = $gameStatus.stopped,
            _eventEmitter = $models.create_eventEmitter(),
            _pool = [],
            _map = {};

        // add some 'collection magic' to objects
        Object.prototype.each = function(callback){
            var prop;

            for (prop in this) {
                if(this[prop] && this.hasOwnProperty(prop)){
                    callback(this[prop]);
                }
            }
        };

        ///<summary> Private methods </summary>

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

                        if (x <= 0) {
                            x = _xMax;
                        }

                        if (y <= 0) {
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
            _lifeExists = function () {
                return _map[$cellGens.young].count() > 0 || _map[$cellGens.old].count() > 0;
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
            _transferCell = function (cell, from, to) {
                var f = _map[from],
                    t = _map[to];

                if(f && t){
                    if (f.contains(cell)){
                        f.remove(cell);
                        t.add(cell);
                    }
                }
            },
            _transfer = function (){

            },
            _lifeCycle = function (callback) {
                var func = function (el) {
                    callback(el, _findNeighbors(el));
                };

                // update young generation
                _eachCell(function (el){
                    el.persist();

                    _map[$cellGens.old].add(el);
                }, $cellGens.young);

                _free($cellGens.young);

                _eachCell(func, $cellGens.old);
                _eachCell(func, $cellGens.none);
            },
            _onCellChange = function (options) {
//                _eventEmitter.fire($gameEvents.onCellDead, {event: $gameEvents.onCellDead, x: cell.x(), y: cell.y()})
//                transition.push(cell);
            };

        _map[$cellGens.none] = $models.create_cellCollection();
        _map[$cellGens.young] = $models.create_cellCollection();
        _map[$cellGens.old] = $models.create_cellCollection();

        this.start = function (options) {
            var i, // just counter
                maxLength, //transition array length
                c, // temporary ref to cell
                transition = []; // collection of cells that must be transfered to different state collections

            _status = $gameStatus.started;
            _eventEmitter.fire($gameEvents.onStart);

            _populate(options.xMax, options.yMax);
            options.selected.each(function(coordinates) {
                _findCell(coordinates, $cellGens.none).born();
            });

            // cells life cycle
            while(_lifeExists()) {
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

                // transfer cells
                // TODO: not good approach! must be something more efficient...
                if (transition.length > 0) {
                    maxLength = transition.length;
                    for (i = 0; i < maxLength; i += 1) {
                        c = transition.pull[i];
                        if (c) {
                            switch(c.gen()){
                                case $cellGens.none:
                                    _transferCell(c, $cellGens.old, $cellGens.none);
                                    break;
                                case $cellGens.young:
                                    _transferCell(c, $cellGens.none, $cellGens.young);
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                }
            }

            this.stop();
        };

        this.stop = function () {
            _free();
            _status = $gameStatus.stopped;
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