"use strict";

GameOfLife.register('$commonEvents', function(){
    return {
        changed: 'changed'
    };
});

GameOfLife.register('$gameStatuses', function () {
    return {
        started: 'started',
        stopped: 'stopped'
    };
});

GameOfLife.register('$gameEvents', function() {
    return {
        onStart: 'onStart',
        onStop: 'onStop',
        onCellDead: 'onCellDead',
        onCellAlive: 'onCellAlive'
    };
});

GameOfLife.register('$cellGenerations', function() {
    return {
        none: 'none',
        young: 'young',
        old: 'old'
    };
});