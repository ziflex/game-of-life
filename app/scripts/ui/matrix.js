'use strict';

namespaces.register({
    path: 'ui.$matrix',
    init: function () {
        return function(options) {
            return (function () {

                /// <summary>
                /// Private properties
                /// </summary>
                var _self = {},
                    _cells = {},
                    _$table,
                    _$parent,
                    _rowCount = 0,
                    _columnCount = 0,
                    _isInitialized = false;


                /// <summary>
                /// Private methods
                /// </summary>
                var _validate = function () {
                        if (!options.parent) {
                            throw 'Parent element is invalid!'
                        }

                        if (!options.rows) {
                            throw 'Row quantity is invalid!'
                        }

                        if (!options.rows) {
                            throw 'Row quantity is invalid!'
                        }
                    },
                    _init = function () {
                        _validate();

                        _rowCount = options.rows;
                        _columnCount = options.columns;
                        _$parent = $(options.parent);

                        _$table = $('<table><tbody></tbody></table>');
                        _$table.addClass('table table-bordered');

//                        _$parent.append(_$table);

                        _$table.on('click', 'td', function (event) {
                            var el = $(this);

                            if (_onCellClick) {
//                                _onCellClick.apply(el, )
                            }
                        });

                        _isInitialized = true;
                    },
                    _id = function (x, y) {
                      return 'x' + x +'y' +y;
                    },
                    _onCellClick;

                _self.columns = function (value) {
                    if (value) {
                        _columnCount = value;
                        self.render();
                    }

                    return _columnCount;
                };

                _self.rows = function (value) {
                    if (value) {
                        _rowCount = value;
                        self.render();
                    }

                    return _rowCount;
                };

                _self.cell = function (x, y) {

                };

                _self.render = function () {
                    var x, y, tr, td, span, id;

                    if (!_isInitialized) {
                        _init();
                    }

                    // remove all elements before rendering
                    _$table.remove();

                    for (y = 0; y <= _rowCount; y += 1) {
                        tr = $('<tr></tr>');

                        for(x = 0; x <= _columnCount; x += 1) {
                            id = _id(x, y);
                            td = $('<td><span>&nbsp</span></td>');
                            td.attr('id', id);
                            td.attr('data-x', x);
                            td.attr('data-y', y);

                            tr.append(td);

                            _cells[id] = td;
                        }

                        _$table.append(tr);
                    }

                    _$parent.append(_$table);
                };

                return _self;
            })();
        }
    }
});

namespaces.register({
    path: 'ui.matrix.$row',
    init: function () {
        return function (x, y) {
            var result = document.createElement('tr');
        };
    }
});