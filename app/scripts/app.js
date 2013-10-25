'use strict';

var GameOfLife = (function() {

    /// <summary>
    /// Private Properties
    /// </summary>
    var _self = {},
        _isInitialized = false,
        _modules = {},
        _instances = {};

    /// <summary>
    /// Private Methods
    /// </summary>
    var resolve = function (name) {
            var i, resolved;

            if (_instances[name]) {
                return _instances[name];
            }

            if (_modules[name].dependencies.length === 0) {
                return _modules[name].module.apply(name);
            }

            resolved = [];
            for (i = 0; i < _modules[name].dependencies.length; i += 1) {
                resolved.push(resolve(_modules[name].dependencies[i]));
            }

            return _modules[name].module.apply(name, resolved);
        };

    /// <summary>
    /// Public Methods
    /// </summary>
    _self.register = function (name, func, dependencies) {
        var dependencies,
            func;

        if (_modules[name]) {
            throw 'A name "' + name + '" is not unique!';
        }

        _modules[name] = {
            module: func,
            dependencies: dependencies || []
        }
    };

    _self.init = function () {
        var prop;

        if (_isInitialized) {
            return;
        }

        for (prop in _modules) {
            if (!_instances[prop]) {
                _instances[prop] = resolve(prop);
            }
        }

        _isInitialized = true;
    };

    _self.run = function () {
        var $game;

        $game = _instances['$game'];

    };

    _self.stop = function () {

    };

    return _self;
})();


