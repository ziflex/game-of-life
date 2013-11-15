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
                    _rows = {},
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
                        _$table.appendTo(_$parent);
                        _$table.addClass('table table-bordered');

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
                        _self.render();
                    }

                    return _columnCount;
                };

                _self.rows = function (value) {
                    if (value) {
                        _rowCount = value;
                        _self.render();
                    }

                    return _rowCount;
                };

                _self.cell = function (x, y) {

                };

                _self.render = function () {
                    var x, y, tr, td, span, id, childCount;

                    if (!_isInitialized) {
                        _init();
                    }

                    // remove all elements before rendering
                    _$table.children().remove();

                    for (y = 0; y <= _rowCount; y += 1) {

                        if (!_rows[y]) {
                            _rows[y] = $('<tr></tr>');
                        }

                        tr = _rows[y];
                        childCount = tr.children().length;

                        for(x = 0; x <= _columnCount; x += 1) {
                            id = _id(x, y);

                            if (!_cells[id]) {
                                td = $('<td><span>&nbsp</span></td>');
                                td.attr('id', id);
                                td.attr('data-x', x);
                                td.attr('data-y', y);
                                _cells[id] = td;
                            }

                            if (x > childCount) {
                                tr.append(_cells[id]);
                            }
                        }

                        // remove redundant children
                        if (_columnCount < childCount) {
                            for (x = childCount; _columnCount < childCount; childCount -= 1) {
                                id = _id(x, y);
                                _cells[id].remove();
                            }
                        }

                        _$table.append(tr);
                    }
                };

                return _self;
            })();
        }
    }
});