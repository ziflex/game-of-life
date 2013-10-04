"use strict";
angular.module('gol.factories', ['gol.constants'])
    .service('$models', function($commonEvents, $cellGens) {
        this.create_Cell = function (x, y) {
            return (function(eventEmitter) {
                /// <summary>
                /// Private properties
                /// </summary>
                var _self,
                    _x = x,
                    _y = y,
                    _generation = $cellGens.none,
                    _isAlive = false,
                    _eventEmitter = eventEmitter;

                /// <summary>
                /// Private methods
                /// </summary>
                var _validateChangingGen = function (current, next) {
                        var isValid = true;

                        if (current === $cellGens.none && next === $cellGens.old) {
                            isValid = false;
                        }

                        if (!isValid) {
                            throw "Not allowed generation transition!"
                        }
                    },
                    _changeGen = function (nextGen) {
                        var prevGen = _generation;
                        _generation = nextGen;

                        _validateChangingGen(prevGen, nextGen);

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

                        _eventEmitter.fire($commonEvents.changed, {cell: _self, from: prevGen, to: nextGen});
                };

                _self = {
                    gen: function () {
                        return _generation;
                    },
                    kill: function () {
                        _changeGen($cellGens.none);

                        return _self;
                    },
                    born: function () {
                        _changeGen($cellGens.young);

                        return _self;
                    },
                    persist: function () {
                        _changeGen($cellGens.old);

                        return _self;
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
                        return _self;
                    },
                    off: function (eventName, eventHandler) {
                        _eventEmitter.on(eventName, eventHandler)
                        return _self;
                    }
                };

                return _self;
            })(this.create_eventEmitter());
        };

        this.create_cellCollection = function () {
            return (function () {

                /// <summary>
                /// Private properties
                /// </summary>
                var _self,
                    _data = {},
                    _count = 0,
                    _transaction = false,
                    _toDelete = [],
                    _toAdd = [];

                /// <summary>
                /// Private methods
                /// </summary>
                var _indexOf = function (p1, p2) {
                    var result;

                    if(typeof p2 === 'undefined') {
                        result = _indexOf(p1.x(), p1.y());
                    } else {
                        result = 'x' + p1 + '_y' + p2;
                    }

                    return result;
                    };

                _self = {
                    add: function (cell) {
                        if (!cell) {
                            return;
                        }

                        if (!_transaction) {
                            _data[_indexOf(cell)] = cell;
                            _count += 1;
                        } else {
                            _toAdd.push(cell);
                        }
                    },
                    get: function (x, y) {
                        return _data[_indexOf(x, y)];
                    },
                    remove: function (cell) {
                        if (!_data[_indexOf(cell)]){
                            return;
                        }

                        if  (!_transaction) {
                            delete _data[_indexOf(cell)];
                            _count -= 1;
                        } else {
                            _toDelete.push(cell);
                        }
                    },
                    count: function () {
                        return _count;
                    },
                    each: function (callback) {
                        var prop, result;

                        if (!callback) {
                            return;
                        }

                        for (prop in _data) {
                            if (_data[prop] && _data.hasOwnProperty(prop)) {
                                result = callback(_data[prop]);

                                // check if we need to exit from loop
                                if (typeof (result) === 'boolean') {
                                    if (result === false) {
                                        break;
                                    }
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
                        if (_data[_indexOf(cell)]){
                            return true;
                        }

                        return false;
                    },
                    beginTransaction: function () {
                        _transaction = true;

                        _toAdd.length = 0;
                        _toDelete.length = 0;
                    },
                    commitTransaction: function () {
                        _transaction = false;

                        _toAdd.each(function(c){
                            _self.add(c);
                        });

                        _toDelete.each(function(c){
                            _self.remove(c);
                        });
                    }
                };

                return _self;
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