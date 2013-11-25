'use strict';

namespaces.register({
    path: 'core.utilities.$logger',
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

namespaces.register({
    path: 'core.utilities.$extenders',
    init: function () {
        if (!Array.prototype.each) {
            Array.prototype.each = function (callback) {
                var i, max = this.length;

                if (!callback) {
                    return;
                }

                for (i = 0; i < max; i += 1) {
                    callback(this[i]);
                }
            }
        }

        return true;
    }
})