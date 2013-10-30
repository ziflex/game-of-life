'use strict';

namespaces.register({
    namespace: 'core.utilities.$logger',
    init: function () {
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
        };
    }
});
