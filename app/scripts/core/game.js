"use strict";

namespaces.register({
    path: 'core.$game',
    dependencies: {
        'core.utilities' : ['$logger'],
        'core.models' : ['$hash', '$eventEmitter', '$cell', '$cellCollection', '$message'],
        'core.constants' : ['$gameStatuses', '$commonEvents', '$gameEvents', '$cellGenerations']
    },
    init: function($logger, $hash, $eventEmitter, $cell, $cellCollection, $message, $gameStatus, $commonEvents, $gameEvents, $cellGens) {
        return (function() {
            /// <summary>
            /// Private properties
            /// </summary>
            var _self = {},
                _initialized = false,
                _xMax = 0,
                _yMax = 0,
                _status = $gameStatus.stopped,
                _eventEmitter = $eventEmitter(),
                _pool = [], // cells pool
                _map = $hash(), // cells gen map
                _changes = false, // cells changes per cycle
                _message,
                _lastCoordinates = [],
                _cycleCount = 0,
                _offsets = [
                    {x: -1, y: 0},
                    {x: -1, y: 1},
                    {x: -1, y: -1},
                    {x: 0, y: 1},
                    {x: 0, y: -1},
                    {x: 1, y: 0},
                    {x: 1, y: 1},
                    {x: 1, y: -1}];


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

                    if (typeof (from) === 'string' && _map.contains(from)) {
                        func(_map.get(from));
                    } else if (Array.isArray(from)) {
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

                    if (typeof (from) === 'string' && _map.contains(from)) {
                        result = _map.get(from).get(coordinates.x, coordinates.y);
                    } else {
                        if (Array.isArray(from)){
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
                    var f = _map.get(from),
                        t = _map.get(to);

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

                    _offsets.each(function(offset){
                        // get only live cells and not of the current generation
                        neighbor = _findCell(getNeighborCoordinates(offset), $cellGens.old);

                        if (neighbor) {
                            result.push(neighbor);
                        }
                    });

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

                            _map.get($cellGens.none).add(_pool[i-1]);
                        }
                    }
                },
                _free = function (from) {
                    if (from && _map.contains(from)){
                        _map.get(from).clear();
                    } else {
                        _map.each(function(g) {
                            g.clear();
                        })
                    }
                },
                _checkRule = function(cell, neighbors){
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
                },
                _lifeCycle = function () {
                    var func = function (el) {
                            _checkRule(el, _findNeighbors(el));
                        };

                    _cycleCount += 1;
                    $logger.write('Cycle number {0}', _cycleCount);

                    // save the previous cells position
                    _lastCoordinates.push(_encodePosition([ $cellGens.young, $cellGens.old]));

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
                _canContinue = function () {
                    var matchedPosition,
                        encodedPosition,
                        result = _status !== $gameStatus.stopped;

                    if (result) {
                        result = (_map.get($cellGens.young).count() > 0 || _map.get($cellGens.old).count() > 0) && _changes
                    }

                    if (result && _lastCoordinates.length > 0) {
                        encodedPosition = _encodePosition([$cellGens.young, $cellGens.old]);
                        matchedPosition = _lastCoordinates[encodedPosition];

                        if  (matchedPosition) {
                            result = false;
                        }
                    }

                    return result;
                },
                _continue = function () {
                    if (_canContinue()) {
                        // clear message attachment
                        _message.attachments.length = 0;

                        // run the game cycle
                        _lifeCycle();

                        // fire event about completing game cycle and wait invoking callback to continue
                        _eventEmitter.fire($gameEvents.cycleComplete, _message)
                    } else {
                        _self.stop();
                    }
                },
                _onCellChange = function (eventName, options) {
                    if (!options || _status === $gameStatus.stopped) {
                        return;
                    }

                    // for rule checking
                    _changes = true;

                    // if it's not initialization events
                    if (_initialized) {
                        // don't render old cells
                        // they are already rendered
                        if (options.to !== $cellGens.old) {
                            // for outer subscriber
                            _message.attachments.push({
                                gen: options.to,
                                x: options.cell.x(),
                                y: options.cell.y()
                            });
                        }
                    }

                    // collection migration
                    _moveCell(options.cell, options.from, options.to);

                    $logger.write('Cell x:{0} y:{1} is {2}.', options.cell.x(), options.cell.y(), options.to);
                },
                _encodePosition = function (from) {
                    var result = '';

                    _eachCell(function(c){
                        result += 'x' + c.x() + 'y' + c.y() + ';';
                    }, from);

                    return result;
                };

            _map.add($cellGens.none,$cellCollection());
            _map.add($cellGens.young, $cellCollection());
            _map.add($cellGens.old, $cellCollection());

            _self.start = function (options) {
                if (_status === $gameStatus.started) {
                    return;
                }

                $logger.write('Game is started.');

                _status = $gameStatus.started;
                _eventEmitter.fire($gameEvents.start);

                _xMax = options.xMax;
                _yMax = options.yMax;
                _cycleCount = 0;
                _lastCoordinates.length = 0;

                // use one instance per game
                _message = $message(function () {
                    _continue();
                }, []);

                // fill collections
                _populate(options.xMax, options.yMax);

                // starting cells
                options.selected.each(function(coordinates) {
                    _findCell(coordinates, $cellGens.none).born();
                });

                _initialized = true;

                _continue();
            };

            _self.stop = function () {
                if (_status === $gameStatus.stopped) {
                    return;
                }

                _status = $gameStatus.stopped;
                _initialized = false;

                _eachCell(function(c){
                    c.kill();
                }, [$cellGens.young, $cellGens.old]);

                _free();
                _lastCoordinates.length = 0;

                _eventEmitter.fire($gameEvents.stop);
                $logger.write('Game is stopped.');
            };

            _self.status = function () {
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