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
                _matrix;

            /// <summary>
            /// Private methods
            /// </summary>
            var _handlers = {
                setRows: function (element) {
                    _matrix.rows(parseInt(element.value));
                },
                setColumns: function (element) {
                    _matrix.columns(parseInt(element.value));
                }
            };

            _matrix = $matrix({
                parent: $('#matrix')[0],
                rows: 10,
                columns: 10,
                onCellClick: function () {

                }
            });

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