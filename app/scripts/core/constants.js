"use strict";

namespaces.register({
    path: 'core.constants.$commonEvents',
    init: function () {
        return {
            changed: 'changed'
        };
    }
});

namespaces.register({
    path: 'core.constants.$gameStatuses',
    init: function () {
        return {
            started: 'started',
            stopped: 'stopped'
        };
    }
});

namespaces.register({
    path: 'core.constants.$gameEvents',
    init: function () {
        return {
            onStart: 'onStart',
            onStop: 'onStop',
            onCellDead: 'onCellDead',
            onCellAlive: 'onCellAlive'
        };
    }
});

namespaces.register({
    path: 'core.constants.$cellGenerations',
    init: function () {
        return {
            none: 'none',
            young: 'young',
            old: 'old'
        };
    }
});