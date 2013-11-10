"use strict";

namespaces.register({
    path: 'core.$game',
    dependencies: {
        'core.utilities' : ['$logger'],
        'core.models' : ['$hash', '$eventEmitter', '$cell', '$cellCollection'],
        'core.constants' : ['$gameStatuses', '$commonEvents', '$gameEvents', '$cellGenerations']
    },
    init: function($logger, $hash, $eventEmitter, $cell, $cellCollection, $gameStatus, $commonEvents, $gameEvents, $cellGens) {
        return (function() {
            /// <summary>
            /// Private properties
            /// </summary>
            var _self = {},
                _xMax = 0,
                _yMax = 0,
                _status = $gameStatus.stopped,
                _eventEmitter = $eventEmitter(),
                _pool = [], // cells pool
                _map = {}, // cells gen map
                _changes = false, // cells changes per cycle
                _lastCoordinates = [],
                _cycleCount = 0;


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

                    if (typeof (from) === 'string' && _map[from]) {
                        func(_map[from]);
                    } else if (typeof (from) === 'object' && from.constructor.toString() === 'function Array() { [native code] }') {
                        from.each(function(f){
                            _eachCell(callback, f, where);
                        });
                    } else {
                        _map.each(func);
                    }
                },
                _findCell = function (coordinates, from) {
                    var result,
                        func = function (f) {
                            result = _findCell(coordinates, f);

                            return result ? false : true;
                        };

                    if (typeof (from) === 'string' && _map[from]) {
                        result = _map[from].get(coordinates.x, coordinates.y);
                    } else {
                        if (typeof (from) === 'object' && from.constructor.toString() === 'function Array() { [native code] }'){
                            from.each(function(f){
                                return func(f);
                            });
                        } else {
                            _map.each(function (c, f){
                                return func(f);
                            });
                        }
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
                    var neighbor,
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
                    var i,
                        result = (_map[$cellGens.young].count() > 0 || _map[$cellGens.old].count() > 0) && _changes;

                    if (result) {
                        for (i = 0; i < _lastCoordinates.length; i += 1) {
                            if (!_findCell(_lastCoordinates[i], [$cellGens.young, $cellGens.old])){
                                result = false;
                                break;
                            }
                        }
                    }

                    return result;
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
                                cell = $cell(x, y);
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

                    _cycleCount += 1;
                    $logger.write('Cycle number {0}', _cycleCount);

                    // save the previous cells position
                    _lastCoordinates.length = 0;
                    _eachCell(function(c){
                        _lastCoordinates.push({x: c.x(), y: c.y()});
                    }, [$cellGens.young,  $cellGens.old]);

                    // update young generation
                    _eachCell(function (el){
                        el.persist();
                    }, $cellGens.young);

                    _free($cellGens.young);

                    // start cells migration
                    _map.each(function(m){
                        m.beginTransaction();
                    });

                    _changes = false;
                    _eachCell(func, [$cellGens.old,  $cellGens.none]);

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

                    $logger.write('Cell x:{0} y:{1} is {2}.', options.cell.x(), options.cell.y(), options.to);
                };

            _map[$cellGens.none] = $cellCollection();
            _map[$cellGens.young] = $cellCollection();
            _map[$cellGens.old] = $cellCollection();

            _self.start = function (options) {
                $logger.write('Game is started.');

                _status = $gameStatus.started;
                _eventEmitter.fire($gameEvents.onStart);

                _xMax = options.xMax;
                _yMax = options.yMax;
                _cycleCount = 0;

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

                _self.stop();
            };

            _self.stop = function () {
                _status = $gameStatus.stopped;

                _eachCell(function(c){
                    c.kill();
                }, [$cellGens.young, $cellGens.old]);

                _free();

                _eventEmitter.fire($gameEvents.onStop);
                $logger.write('Game is stopped.');
            };

            _self.get_status = function () {
                return _status;
            };

            _self.on = function (eventName, handler) {
                _eventEmitter.on(eventName, handler);
            };

            _self.off = function (eventName, handler) {
                _eventEmitter.off(eventName, handler);
            };

            return _self;
        })();
    }}
);