'use strict';

namespaces.register({
    path: 'core.$app',
    dependencies: {
        'ui' : ['$matrix'],
        'core' : ['$game'],
        'core.constants': ['$gameEvents', '$gameStatuses'],
        'core.utilities' : ['$extenders']
    },
    init: function ($matrix, $game, $gameEvents, $gameStatuses) {
        return (function (){

            /// <summary>
            /// Private properties
            /// </summary>
            var _self = {},
                _controls = {},
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
                cellEvent: function (options) {
                    if (options.event === $gameEvents.onCellDead) {
                        _controls.matrix.deselect(options.x, options.y);
                    } else if (options.event === $gameEvents.onCellAlive) {
                        _controls.matrix.select(options.x, options.y);
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

            $game.on($gameEvents.onStart, function () {
                _controls.button.prop('disabled', true);
                _state.startTime = new Date();
            });

            $game.on($gameEvents.onCellDead, _handlers.cellEvent);

            $game.on($gameEvents.onCellAlive, _handlers.cellEvent);

            $game.on($gameEvents.onStop, function () {
                _state.endTime = new Date();
                _controls.button.prop('disabled', false);
            });

            _controls.matrix = $matrix({
                parent: $('#matrix')[0],
                rows: 10,
                columns: 10
            });

            _controls.button = $('button');

            _controls.matrix.render();
        })();
    }
});