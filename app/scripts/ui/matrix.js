'use strict';

namespaces.register({
    path: 'ui.$matrix',
    dependencies: {
        'core.models' : ['$hash']
    },
    init: function ($hash) {
        return function(options) {
            return (function () {

                /// <summary>
                /// Private properties
                /// </summary>
                var _self = {},
                    _cache = {
                        cells: $hash(),
                        rows: $hash(),
                        selectedCells: $hash()
                    },
                    _table = {
                        $el: '',
                        $body: ''
                    },
                    _$parent,
                    _rowCount = 0,
                    _columnCount = 0,
                    _state = {
                        initialized: false,
                        disabled: false
                    },
                    _style = {
                        color: {
                            selected: '#dff0d8',
                            unselected: '#fafafa'
                        }
                    };


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

                        _table.$el = $('<table><tbody></tbody></table>');
                        _table.$el.appendTo(_$parent);
                        _table.$el.addClass('table table-bordered');
                        _table.$body = _table.$el.find('tbody');

                        _table.$body.on('click', 'td', function () {
                            if (_state.disabled) {
                                return;
                            }

                            var cell = $(this),
                                x = cell.attr('data-x'),
                                y = cell.attr('data-y');

                            if (cell.attr('data-selected') === 'true') {
                                _deselect(x, y, null, true);
                            } else {
                                _select(x, y, null, true);
                            }
                        });

                        _state.initialized = true;
                    },
                    _id = function (x, y) {
                      return 'x' + x +'y' +y;
                    },
                    _toggleCell = function (cell, selected, callback, noAnimation) {
                        var timer = noAnimation ? 1 : 400,
                            color;

                        if (selected) {
                            color = _style.color.selected;
                        } else {
                            color = _style.color.unselected;
                        }

                        cell.attr('data-selected', selected);

                        callback = callback || function () {};

                        cell.animate({
                            backgroundColor: color
                        }, timer, callback);
                    },
                    _select = function (x, y, callback, noAnimation) {
                        var cell, id = _id(x, y);

                        if (!_cache.selectedCells.contains(id)) {
                            cell = _cache.cells.get(id);

                            if (cell) {
                                _cache.selectedCells.add(id, cell);
                                _toggleCell(cell, true, callback, noAnimation);
                            }
                        }
                    },
                    _deselect = function (x, y, callback, noAnimation){
                        var id = _id(x, y), cell = _cache.selectedCells.get(id);

                        if (cell) {
                            _cache.selectedCells.remove(id);
                            _toggleCell(cell, false, callback, noAnimation);
                        }
                    };

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

                _self.getSelected = function () {
                    return _cache.selectedCells.toArray(function (v, k) {
                        return {
                            x: parseInt(v.attr('data-x'), 10),
                            y: parseInt(v.attr('data-y'), 10)
                        }
                    });
                };

                _self.select = function (x, y, callback) {
                    _select(x, y, callback);
                };

                _self.deselect = function (x, y, callback){
                    _deselect(x, y, callback);
                };

                _self.deselectAll = function () {
                    _cache.selectedCells.clear(function(c){
                        _toggleCell(c, false, null, true);
                    });
                };

                _self.disable = function (value) {
                    if (typeof (value) === 'boolean') {
                        _state.disabled = value;
                    }

                    return _state.disabled;
                };

                _self.render = function () {
                    var x, y, tr, td, span, id, curRowMaxIndex, curColMaxIndex,
                        newRowMaxIndex, newColMaxIndex;

                    if (!_state.initialized) {
                        _init();
                    }

                    // remove all elements before rendering
                    newRowMaxIndex = _rowCount -1;
                    curRowMaxIndex = _table.$body[0].childNodes.length-1;

                    for (y = 0; y < _rowCount; y += 1) {

                        if (!_cache.rows.contains(y)) {
                            _cache.rows.add(y,$('<tr></tr>'));
                        }

                        tr = _cache.rows.get(y);
                        newColMaxIndex = _columnCount - 1;
                        curColMaxIndex = tr[0].childNodes.length-1;

                        for(x = 0; x < _columnCount; x += 1) {
                            id = _id(x, y);

                            if (!_cache.cells.contains(id)) {
                                td = $('<td><span>&nbsp</span></td>');
                                td.attr('id', id);
                                td.attr('data-x', x);
                                td.attr('data-y', y);
                                td.attr('data-selected', false);
                                _cache.cells.add(id, td);
                            }

                            if (x >= curColMaxIndex) {
                                tr.append(_cache.cells.get(id));
                            }
                        }

                        // remove redundant children
                        if (newColMaxIndex < curColMaxIndex) {
                            for (x = curColMaxIndex; newColMaxIndex < x; x -= 1) {
                                id = _id(x, y);

                                if (_cache.cells.get(id).attr('data-selected') === 'true') {
                                    _self.deselect(x, y);
                                }

                                _cache.cells.get(id).remove();
                            }
                        }

                        if (y >= curRowMaxIndex) {
                            _table.$body.append(tr);
                        }
                    }

                    if (newRowMaxIndex < curRowMaxIndex) {
                        for (y = curRowMaxIndex; newRowMaxIndex < y; y -= 1) {

                            // remove selected cells in removing row
                            curColMaxIndex = _cache.rows.get(y)[0].childNodes.length;

                            for (x = 0; x < curColMaxIndex; x += 1) {
                                id = _id(x, y);

                                if (_cache.cells.get(id).attr('data-selected') === 'true') {
                                    _self.deselect(x, y);
                                }
                            }

                            _cache.rows.get(y).remove();
                        }
                    }
                };

                return _self;
            })();
        }
    }
});