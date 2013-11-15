'use strict';

namespaces.register({
    path: 'core.$app',
    dependencies: {
        'ui' : ['$matrix'],
        'core' : ['$game']
    },
    init: function ($matrix, $game) {
        return (function (){

            /// <summary>
            /// Private properties
            /// </summary>
            var _self = {},
                _controls = {},
                _game = $game();

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
                run: function () {
                    this.disable();
                }
            };

            _controls.matrix = $matrix({
                parent: $('#matrix')[0],
                rows: 10,
                columns: 10
            });

            _controls.button = $('button');

            $('[data-action]').on('click', function (event) {
                var el = $(this),
                    action = el.attr('data-action');

                if(_handlers[action]) {
                    _handlers[action].apply(this, el);
                }
            });

            _matrix.render();
        })();
    }
});