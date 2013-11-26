'use strict';

namespaces.register({
    path: 'core.$app',
    dependencies: {
        'ui' : ['$matrix'],
        'core' : ['$game'],
        'core.constants': ['$gameEvents', '$gameStatuses', '$cellGenerations'],
        'core.utilities' : ['$extenders']
    },
    init: function ($matrix, $game, $gameEvents, $gameStatuses, $cellGenerations) {
        return (function (){

            /// <summary>
            /// Private properties
            /// </summary>
            var _controls = {},
                _state = {
                    startTime: new Date(),
                    endTime: new Date()
                };

            /// <summary>
            /// Private methods
            /// </summary>
            var _handlers = {
                    setRows: function (element) {
                        _controls.matrix.rows(parseInt(element.value, 10));
                    },
                    setColumns: function (element) {
                        _controls.matrix.columns(parseInt(element.value, 10));
                    },
                    render: function (eventName, message) {
                        var cells = 0,
                            callbacksFired = 0;

                        if (message && message.attachments && Array.isArray(message.attachments)) {
                            cells = message.attachments.length;

                            if (cells > 0) {
                                message.attachments.each(function (c) {
                                    var matrixFunc;

                                    switch(c.gen) {
                                        case $cellGenerations.young:
                                            matrixFunc = _controls.matrix.select;
                                            break;
                                        case $cellGenerations.none:
                                            matrixFunc = _controls.matrix.deselect;
                                            break;
                                        default:
                                            break;
                                    }

                                    if (matrixFunc) {
                                        matrixFunc(c.x, c.y, function () {
                                            callbacksFired += 1;

                                            if (cells === callbacksFired) {
                                                message.callback();
                                            }
                                        });
                                    }
                                });
                            } else {
                                message.callback();
                            }
                        }
                    },
                    start: function () {
                        if ($game.status() === $gameStatuses.stopped) {
                            $game.start({
                                xMax: _controls.matrix.columns(),
                                yMax: _controls.matrix.rows(),
                                selected: _controls.matrix.getSelected()
                            });
                        }
                    },
                    stop: function () {
                        if ($game.status() === $gameStatuses.started) {
                            $game.stop();
                        }
                    },
                    clear: function () {
                        if ($game.status() === $gameStatuses.stopped) {
                            _controls.matrix.deselectAll();
                        }
                    }
            },
                eventHandler = function(event) {
                    var el = $(this),
                        action = el.attr('data-' + event.type + '-action');

                    if(_handlers[action]) {
                        _handlers[action].apply(this, el);
                    }
                };

            $('[data-click-action]').on('click', eventHandler);
            $('[data-change-action]').on('change', eventHandler);

            $game.on($gameEvents.start, function () {
                _controls.columnsCount.disable(true);
                _controls.rowsCount.disable(true);
                _controls.matrix.disable(true);
                _controls.starter.toggle();
                _state.startTime = new Date();
            });

            $game.on($gameEvents.cycleComplete, _handlers.render);

            $game.on($gameEvents.stop, function () {
                _controls.columnsCount.disable(false);
                _controls.rowsCount.disable(false);
                _controls.matrix.disable(false);
                _controls.starter.toggle();
                _state.endTime = new Date();

            });

            _controls.starter = {
                el: $('#starter'),
                toggle: function () {
                    var action = this.el.attr('data-click-action') === 'stop' ? 'start' : 'stop';

                    this.el.toggleClass('btn-success', action === 'start');
                    this.el.toggleClass('btn-danger', action !== 'start');

                    this.el.attr('data-click-action', action);
                    this.el.html(action === 'start' ? 'Start' : 'Stop');
                }
            };

            _controls.columnsCount = {
                el: $('.columns-count'),
                val: function () {
                    return parseInt(this.el.val(), 10);
                },
                disable: function (val) {
                    if (typeof(val) === 'boolean' ) {
                        this.el.prop('disabled', val);
                    }

                    return this.el.prop('disabled');
                }
            };

            _controls.rowsCount = {
                el: $('.rows-count'),
                val: function () {
                    return parseInt(this.el.val(), 10);
                },
                disable: function (val) {
                    if (typeof(val) === 'boolean' ) {
                        this.el.prop('disabled', val);
                    }

                    return this.el.prop('disabled');
                }
            };

            _controls.matrix = $matrix({
                parent: $('#matrix')[0],
                rows: _controls.rowsCount.val(),
                columns: _controls.columnsCount.val()
            });

            _controls.matrix.render();
        })();
    }
});