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

                            if (cell.hasClass('success')) {
                                _self.deselect(x, y);
                            } else {
                                _self.select(x, y);
                            }
                        });

                        _state.initialized = true;
                    },
                    _id = function (x, y) {
                      return 'x' + x +'y' +y;
                    },
                    _toggleCell = function (cell, selected) {
                        if (selected) {
                            cell.addClass('success');
                        } else {
                            cell.removeClass('success');
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

                _self.select = function (x, y) {
                    var cell, id = _id(x, y);

                    if (!_cache.selectedCells.contains(id)) {
                        cell = _cache.cells.get(id);

                        if (cell) {
                            _toggleCell(cell, true);
                            _cache.selectedCells.add(id, cell);
                        }
                    }
                };

                _self.deselect = function (x, y){
                    var id = _id(x, y), cell = _cache.selectedCells.get(id);

                    if (cell) {
                        _toggleCell(cell, false);
                        _cache.selectedCells.remove(id);
                    }
                };

                _self.deselectAll = function () {
                    _cache.selectedCells.clear(function(c){
                        _toggleCell(c, false);
                    });
                };

                _self.disable = function (value) {
                    if (typeof (value) === 'boolean') {
                        _state.disabled = value;
                    }

                    return _state.disabled;
                };

                _self.render = function () {
                    var x, y, tr, td, span, id, trCount, tdCount;

                    if (!_state.initialized) {
                        _init();
                    }

                    // remove all elements before rendering
                    trCount = _table.$body[0].childNodes.length;

                    for (y = 0; y <= _rowCount; y += 1) {

                        if (!_cache.rows.contains(y)) {
                            _cache.rows.add(y,$('<tr></tr>'));
                        }

                        tr = _cache.rows.get(y);
                        tdCount = tr[0].childNodes.length;

                        for(x = 0; x <= _columnCount; x += 1) {
                            id = _id(x, y);

                            if (!_cache.cells.contains(id)) {
                                td = $('<td><span>&nbsp</span></td>');
                                td.attr('id', id);
                                td.attr('data-x', x);
                                td.attr('data-y', y);
                                _cache.cells.add(id, td);
                            }

                            if (x > tdCount) {
                                tr.append(_cache.cells.get(id));
                            }
                        }

                        // remove redundant children
                        if (_columnCount < tdCount) {
                            for (x = tdCount; _columnCount < x; x -= 1) {
                                id = _id(x, y);
                                _cache.cells.get(id).remove();
                            }
                        }

                        if (y > trCount) {
                            _table.$body.append(tr);
                        }
                    }

                    if (_rowCount < trCount) {
                        for (y = trCount; _rowCount < y; y -= 1) {
                            _cache.rows.get(y).remove();
                        }
                    }
                };

                return _self;
            })();
        }
    }
});