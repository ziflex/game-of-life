"use strict";
angular.module('gol.constants', [])
    .constant('$commonEvents', {
        changed: 'changed'
    })
    .constant('$gameStatus', {
        started: 'started',
        stopped: 'stopped'
    })
    .constant('$gameEvents', {
        onStart: 'onStart',
        onStop: 'onStop',
        onCellDead: 'onCellDead',
        onCellAlive: 'onCellAlive'
    })
    .constant('$cellGens', {
        none: 'none',
        young: 'young',
        old: 'old'
    });

