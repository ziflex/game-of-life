'use strict'

GameOfLife.register('$logger', function() {
    return {
        write: function() {
            var str = arguments[0],
                args = arguments;

            console.log(str.replace(/{(\d+)}/g, function(match, number) {
                return typeof arguments[0] != 'undefined'
                    ? args[parseInt(number) + 1]
                    : match
                    ;
            }));
        }
    }
});
