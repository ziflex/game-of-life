'use strict';

namespaces.register({
    path: 'core.$app',
    dependencies: {
        'ui' : ['$matrix'],
        'core' : ['$game'],
        'core.models' : ['$message'],
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
                        _controls.matrix.rows(parseInt(element.value));
                    },
                    setColumns: function (element) {
                        _controls.matrix.columns(parseInt(element.value));
                    },
                    cycleComplete: function (eventName, message) {
                        var cells = 0,
                            callbacksFired = 0;

                        if (message && message.attachments && Array.isArray(message.attachments)) {
                            cells = message.attachments.length;

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
                    }
            };

            $('[data-action]').on('click', function (event) {
                var el = $(this),
                    action = el.attr('data-action');

                if(_handlers[action]) {
                    _handlers[action].apply(this, el);
                }
            });

            $game.on($gameEvents.start, function () {
                _controls.button.prop('disabled', true);
                _state.startTime = new Date();
            });

            $game.on($gameEvents.cycleComplete, _handlers.cycleComplete);

            $game.on($gameEvents.stop, function () {
                _state.endTime = new Date();
                _controls.button.prop('disabled', false);
            });

            _controls.button = $('button');

            _controls.matrix = $matrix({
                parent: $('#matrix')[0],
                rows: 10,
                columns: 10
            });

            _controls.matrix.render();
        })();
    }
});