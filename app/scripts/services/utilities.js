'use strict'

angular.module('gol.utilities', [])
    .service('$logger', function() {
        this.write = function(){
            var str = arguments[0],
                args = arguments;

            console.log(str.replace(/{(\d+)}/g, function(match, number) {
                return typeof arguments[0] != 'undefined'
                    ? args[parseInt(number) + 1]
                    : match
                    ;
            }));
        };
    });
