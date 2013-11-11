(function (window) {
    'use strict';

    /// <summary>
    /// Private properties
    /// </summary>
    var _self = {},
        _root = {};

    /// <summary>
    /// Private methods
    /// </summary>
    var _parseNamespaceId = function (path) {
            var result, matches = path.trim().toLowerCase().match(/^.*?(?=.\$)/);

            if (matches === null || matches.length === 0) {
                result = '';
            } else {
                result = matches[0];
            }

            return result ? result : '';
        },
        _parseObjectId = function (path) {
            var result, matches = path.trim().toLowerCase().match(/\$(.*)/);

            if (matches === null || matches.length === 0) {
                result = '';
            } else {
                result = matches[0];
            }

            return result ? result : '';
        },
        _getNamespace = function (namespaceId) {
            return _root[namespaceId.toLowerCase()];
        },
        _getObject = function (namespaceId, objectId) {
            var result, namespace = _getNamespace(namespaceId);

            if(namespace) {
                result = namespace[objectId.toLowerCase()];
            }

            return result;
        },
        _registerNamespace = function (namespaceId) {
            var id = namespaceId.toLowerCase();
            if (!_root[id]) {
                _root[id] = {};
            }

            return _root[id];
        },
        _registerObject = function (namespaceId, objectId, options) {
            var namespace = _getNamespace(namespaceId),
                object = {
                    namespace: namespaceId,
                    instance: options
                };

            namespace[objectId.toLowerCase()] = object;

            return object;
        },
        _deregisterNamespace = function (namespaceId) {
            var id = namespaceId.toLowerCase();
            if (_root[id]) {
                delete _root[id];
            }
        },
        _deregisterObject = function (namespaceId, objectId) {
            var namespace = _getNamespace(namespaceId);

            if(namespace) {
                delete namespace[objectId];
            }
        },
        _resolve = function (object) {
            var i,
                prop,
                instance = object.instance,
                dependencyNamespace,
                dependencyObject,
                resolved = [],

                init = function (target, args) {
                    return target.init.apply(target.namespace, args || []);
                };

            if (!instance.init) {
                return instance;
            }

            if (!instance.dependencies) {
                return init(instance);
            }

            // dependencies are in same namespace
            if (Array.isArray(instance.dependencies)) {
                for (i = 0; i < instance.dependencies.length; i += 1) {
                    dependencyObject = _getObject(object.namespace, instance.dependencies[i]);

                    if (!dependencyObject) {
                        throw 'Can not find object "' + instance.dependencies[i] + '" in "' + object.namespace +'" namespace!';
                    }

                    resolved.push(_resolve(dependencyObject));
                }
            } else {
                for (prop in instance.dependencies) {
                    if (instance.dependencies[prop] && instance.dependencies.hasOwnProperty(prop)) {
                        for (i = 0; i < instance.dependencies[prop].length; i += 1) {
                            dependencyNamespace = _getNamespace(prop);

                            if (!dependencyNamespace) {
                                throw 'Can not find namespace "' + prop + '"!';
                            }

                            dependencyObject = _getObject(prop, instance.dependencies[prop][i]);

                            if (!dependencyObject) {
                                throw 'Can not find object "' + instance.dependencies[prop][i] + '" in "' + prop +'" namespace!';
                            }

                            resolved.push(_resolve(dependencyObject));
                        }
                    }
                }
            }

            return init(instance, resolved);
        };

    /// <summary>
    /// Public methods
    /// </summary>
    _self.register = function (options) {
        /// <summary>
        /// Registers the namespace
        /// </summary>
        var objectId,
            namespaceId,
            path,
            namespace;

        if (!options.path || options.path.trim() === '') {
            throw 'Invalid namespace!';
        }

        if (!options.init || typeof (options.init) !== 'function') {
            throw '"' + options.path + '" has invalid init function!';
        }

        if (options.dependencies && typeof (options.dependencies) !== 'object') {
            throw '"' + options.path + '" has invalid dependencies object!';
        }

        path = options.path.trim();

        // get object id
        objectId = _parseObjectId(path);
        if (!objectId) {
            throw '"' + options.path + '" has invalid path! Object id is missed!';
        }

        // get namespace path
        namespaceId = _parseNamespaceId(path);
        if (!namespaceId) {
            throw '"' + options.path + '" has invalid path! Namespace is missed!';
        }

        namespace = _getNamespace(namespaceId);
        if(!namespace) {
            _registerNamespace(namespaceId);
        }

        if (_getObject(namespaceId, objectId)) {
            throw '"' + options.path + '" has not unique id "' + objectId + '" in "' + namespaceId + '" namespace!';
        }

        _registerObject(namespaceId, objectId, options);
    };

    _self.deregister = function (options) {
        /// <summary>
        /// Remove specified or all namespaces
        /// </summary>
        var i, prop, arr, namespace, object;

        // Remove all namespaces
        if (!options) {
            _root = {};
        } else {
            // remove by namespaces
            if (Array.isArray(options)) {
                for (i = 0; i < options.length; i += 1) {
                    namespace = _getNamespace(options[i]);

                    if(!namespace) {
                        throw '"' + options[i] + '" is invalid namespace for de-registration!';
                    }

                    _deregisterNamespace(options[i]);
                }
            } else if(typeof (options) === 'object') {
                // remove by id
                for (prop in options) {
                    if (options[prop] && options.hasOwnProperty(prop)) {
                        namespace = _getNamespace(prop);

                        if(!namespace) {
                            throw '"' + prop + '" is invalid namespace for de-registration!';
                        }

                        // array of object's ids;
                        arr = options[prop];
                        for (i = 0; i < arr.length; i += 1) {
                            object = _getObject(prop, arr[i]);

                            if(!object) {
                                throw '"' + arr[i] + '" is invalid object id for de-registration!';
                            }

                            _deregisterObject(prop, arr[i]);
                        }
                    }
                }
            } else {
                throw 'Invalid parameters for de-registration!';
            }
        }
    };

    _self.init = function () {
        var namespaceId, namespace, objectId, object;

        for (namespaceId in _root) {
            if (_root[namespaceId] && _root.hasOwnProperty(namespaceId)) {
                namespace = _root[namespaceId];
                for (objectId in namespace) {
                    if (namespace[objectId] && namespace.hasOwnProperty(objectId)) {
                        object = namespace[objectId];

                        if (object.instance.init) {
                            object.instance = _resolve(object);
                        }
                    }
                }
            }
        }
    };

    if (window) {
        window['namespaces'] = _self;
    }
})(window);