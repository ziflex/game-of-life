"use strict";
angular.module('gol.factories', ['gol.constants'])
    .service('$models', function($commonEvents, $cellGens) {
        this.create_Cell = function (x, y) {
            return (function() {

                ///<summary> Private properties </summary>
                var _x = x,
                    _y = y,
                    _generation = $cellGens.none,
                    _isAlive = false,
                    _eventEmitter = this.create_eventEmitter();

                ///<summary> Private methods </summary>
                var _changeGen = function (nextGen) {
                    _generation = nextGen;

                    switch (_generation) {
                        case $cellGens.young:
                            _isAlive = true;
                            break;
                        case $cellGens.old:
                            _isAlive = true;
                            break;
                        default:
                            _isAlive = false;
                            break;
                    }

                    _eventEmitter.fire($commonEvents.changed, {
                        coordinates: {
                            x: _x,
                            y: _y
                        },
                        isAlive: _isAlive
                    });
                }

                return {
                    gen: function () {
                        return _generation;
                    },
                    kill: function () {
                        _changeGen($cellGens.none);
                    },
                    born: function () {
                        _changeGen($cellGens.young);
                    },
                    persist: function () {
                        _generation = $cellGens.old;
                    },
                    isAlive: function () {
                        return _isAlive;
                    },
                    x: function () {
                        return _x;
                    },
                    y: function () {
                        return _y;
                    },
                    on: function (eventName, eventHandler) {
                        _eventEmitter.on(eventName, eventHandler)
                    },
                    off: function (eventName, eventHandler) {
                        _eventEmitter.on(eventName, eventHandler)
                    }
                }
            })();
        };

        this.create_cellCollection = function () {
            return (function () {
                var _data, _count, _indexOf;

                _data = {};
                _count = 0;
                _indexOf = function (p1, p2) {
                    var result;

                    if(typeof p2 === 'undefined') {
                        result = _indexOf(p1.x(), p1.y());
                    } else {
                        result = 'x' + p1 + '_y' + p2;
                    }

                    return result;
                }

                return {
                    add: function (cell) {
                        if (!cell) {
                            return;
                        }

                        _data[_indexOf(cell)] = cell;
                        _count += 1;
                    },
                    get: function (x, y) {
                        return _data[_indexOf(x, y)];
                    },
                    remove: function (cell) {
                        if (!_data[_indexOf(cell)]){
                            return;
                        }

                        delete _data[_indexOf(cell)];
                        _count -= 1;
                    },
                    count: function () {
                        return _count;
                    },
                    each: function (callback) {
                        var prop;

                        for (prop in _data) {
                            if (_data[prop] && _data.hasOwnProperty(prop)) {
                                if (callback) {
                                    callback.apply(this, _data[prop]);
                                }
                            }
                        }
                    },
                    clear: function () {
                        var prop;

                        for (prop in _data) {
                            if(_data[prop] && _data.hasOwnProperty(prop)){
                                delete _data[prop];
                            }
                        }

                        _count = 0;
                    },
                    contains: function (cell){
                        if (_data[_indexOf[cell]]){
                            return true;
                        }

                        return false;
                    }
                }
            })();
        };

        this.create_eventEmitter = function () {
            return (function(){
                var _subscribers;

                _subscribers = {
                    any: []
                };

                return {
                    on: function (eventName, eventHandler) {
                        eventName = eventName || 'any';
                        if (!_subscribers[eventName]) {
                            _subscribers[eventName] = [];
                        }

                        _subscribers[eventName].push(eventHandler);
                    },

                    off: function (eventName, eventHandler) {
                        var i, max, subs;
                        eventName = eventName || 'any';

                        if (!_subscribers[eventName]) {
                            return;
                        }

                        subs = _subscribers[eventName];
                        max =  subs.length;

                        for(i = 0; i < max; i += 1) {
                            if (subs[i] === eventHandler) {
                                subs.pull(i);
                            }
                        }
                    },

                    fire: function (eventName, args) {
                        var i, max, subs;
                        eventName = eventName || 'any';
                        args = args | {};

                        if (!_subscribers[eventName]) {
                            return;
                        }

                        subs = _subscribers[eventName];
                        max = subs.length;

                        for (i = 0; i < max; i += 1) {
                            subs[i](eventName, args);
                        }
                    }
                }
            })();
        };
    });