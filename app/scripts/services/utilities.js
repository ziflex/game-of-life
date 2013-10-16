'use strict'

angular.module('gol.utilities', [])
    .service('$logger', function() {
        this.write = function(){
            var str = arguments[0],
                args = arguments,
                dt = new Date(),
                time = dt.getHours() + "-" + dt.getMinutes() + "-" + dt.getSeconds();

            console.log(time + ":" + str.replace(/{(\d+)}/g, function(match, number) {
                return typeof arguments[0] != 'undefined'
                    ? args[parseInt(number) + 1]
                    : match
                    ;
            }));
        };
    });
