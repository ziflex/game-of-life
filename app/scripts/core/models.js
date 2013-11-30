"use strict";

namespaces.register({
    path: 'core.models.$cellCollection',
    dependencies: ['$eventEmitter', '$hash'],
    init: function($eventEmitter, $hash) {
        return function () {
            return (function () {

                /// <summary>
                /// Private properties
                /// </summary>
                var _self,
                    _data = $hash(),
                    _transaction = false,
                    _toRemove = [],
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
                            _data.add(_indexOf(cell), cell);
                        } else {
                            _toAdd.push(cell);
                        }
                    },
                    get: function (x, y) {
                        return _data.get(_indexOf(x, y));
                    },
                    remove: function (cell) {
                        if (!_data.contains(_indexOf(cell))){
                            return;
                        }

                        if  (!_transaction) {
                            _data.remove(_indexOf(cell));
                        } else {
                            _toRemove.push(cell);
                        }
                    },
                    count: function () {
                        return _data.count();
                    },
                    each: function (callback) {
                        _data.each(callback);
                    },
                    clear: function () {
                        _data.clear();
                    },
                    contains: function (p1, p2){
                        return _data.contains(_indexOf(p1, p2));
                    },
                    beginTransaction: function () {
                        _transaction = true;

                        _toAdd.length = 0;
                        _toRemove.length = 0;
                    },
                    commitTransaction: function () {
                        var i;
                        _transaction = false;

                        for (i = 0; i < _toAdd.length; i += 1){
                            _self.add(_toAdd[i]);
                        }

                        for (i = 0; i < _toRemove.length; i += 1){
                            _self.remove(_toRemove[i]);
                        }
                    }
                };

                return _self;
            })();
        }
    }
});

namespaces.register({
    path: 'core.models.$cell',
    dependencies: {
        'core.models' : ['$eventEmitter'],
        'core.constants' : ['$commonEvents', '$cellGenerations']
    },
    init: function($eventEmitter, $commonEvents, $cellGenerations) {
        return function (x, y) {
            return (function() {
                /// <summary>
                /// Private properties
                /// </summary>
                var _self,
                    _x = x,
                    _y = y,
                    _generation = $cellGenerations.none,
                    _isAlive = false,
                    _eventEmitter = $eventEmitter();

                /// <summary>
                /// Private methods
                /// </summary>
                var _validateChangingGen = function (current, next) {
                        var isValid = true;

                        if (current === $cellGenerations.none && next === $cellGenerations.old) {
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
                            case $cellGenerations.young:
                                _isAlive = true;
                                break;
                            case $cellGenerations.old:
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
                        _changeGen($cellGenerations.none);

                        return _self;
                    },
                    born: function () {
                        _changeGen($cellGenerations.young);

                        return _self;
                    },
                    persist: function () {
                        _changeGen($cellGenerations.old);

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
                        _eventEmitter.on(eventName, eventHandler);
                        return _self;
                    },
                    off: function (eventName, eventHandler) {
                        _eventEmitter.on(eventName, eventHandler);
                        return _self;
                    }
                };

                return _self;
            })();
        }
    }
});

namespaces.register({
    path: 'core.models.$hash',
    init: function (){
        return function () {
            return (function() {

                /// <summary>
                /// Private properties
                /// </summary>
                var _self,
                    _data = {},
                    _count = 0;

                _self = {
                    add: function (key, value) {
                        if (!_data[key]) {
                            _data[key] = value;
                            _count += 1;
                        }
                    },
                    remove: function (key) {
                        if (_data[key]) {
                            delete _data[key];
                            _count -= 1;
                        }
                    },
                    get: function (key) {
                        return _data[key];
                    },
                    contains: function (key) {
                        return typeof (_data[key]) !== 'undefined'
                    },
                    count: function () {
                        return _count;
                    },
                    clear: function (select) {
                        var prop, val;

                        select = select || function (v) {  };

                        for (prop in _data) {
                            if(_data[prop] && _data.hasOwnProperty(prop)){
                                val = _data[prop];
                                delete _data[prop];
                                select(val);
                            }
                        }

                        _count = 0;
                    },
                    each: function (callback) {
                        var prop, result;

                        // do not iterate without callback func
                        if (!callback){
                            return;
                        }

                        for (prop in _data) {
                            if(_data[prop] && _data.hasOwnProperty(prop) && typeof (_data[prop]) !== 'function'){
                                result = callback(_data[prop], prop);

                                // check continue iteration or not
                                if (typeof (result) === 'boolean') {
                                    if (result === false) {
                                        break;
                                    }
                                }
                            }
                        }

                    },
                    toArray: function (select) {
                        var self = this, ret = [];

                        select = select || function (v, k) { return v; };

                        self.each(function(val, key) {
                            ret.push(select(val, key));
                        });

                        return ret;
                    }
                };

                return _self;
            })();
        }
    }
});

namespaces.register({
    path: 'core.models.$eventEmitter',
    init: function () {
        return function() {
            return (function() {
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
        }
    }
});

namespaces.register({
    path: 'core.models.$message',
    init: function () {
        return function (callback, attachments) {

            if (typeof(callback) !== 'function'){
                throw 'Message must have callback function!';
            }

            return {
                attachments: attachments,
                callback: callback
            }
        }
    }
});