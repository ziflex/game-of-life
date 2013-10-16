'use strict';
angular.module('gol.controllers', ['gol.services'])
    .controller('MainCtrl', function ($scope, $game, $gameEvents) {
        /// <summary>
        /// Private properties
        /// </summary>
        var _startTime,
            _endTime,
            _resultTime;

        /// <summary>
        /// Private methods
        /// </summary>
        var _getIndexOf = function (x, y) {
                return x + '_' + y;
            },
            _changeCellState = function (cell,selected) {
                var i = 0, timeout = 1000000;

                while(i < timeout){
                    i += 1;
                }

                cell.selected = !selected;
            },
            _onCellEvent = function (eventName, options) {
                var cell = _getCell(options.coordinates.x, options.coordinates.y);

                if (!cell) {
                    return;
                }

                switch(eventName){
                    case $gameEvents.onCellAlive:
                        _changeCellState(cell, true);
                        break;
                    case $gameEvents.onCellDead:
                        _changeCellState(cell, false);
                        break;
                    default:
                        break;
                }
            },
            _getCell = function (x, y) {
                return $('#' + _getIndexOf(x, y)).scope();
            },
            _getSelected = function () {
                var result = [], scope;

                 $('td.success').each(function (index, el){
                     scope = $(el).scope();
                     result[_getIndexOf(scope.$index, scope.$parent.$index)] = {
                         x: scope.$index,
                         y: scope.$parent.$index
                     };
                 });

                return result;
            };

        $scope.isDisabled = false;
        $scope.selected = {};
        $scope.range = function (num) {
            return new Array(num);
        };
        $scope.onCellClick = function (el) {
            var id = _getIndexOf(el.$index, el.$parent.$index);
            el.selected = !el.selected;
        },
        $scope.start = function(){

            $scope.isDisabled = true;

            $game.on($gameEvents.onStart, function() {
                _startTime = new Date();
            });

            $game.on($gameEvents.onStop, function() {
                _endTime = new Date();
                _resultTime = _endTime - _startTime;

                $scope.isDisabled = false;
            });

            $game.on($gameEvents.onCellDead, _onCellEvent);

            $game.on($gameEvents.onCellAlive, _onCellEvent);

            $game.start({
                xMax: $scope.xMax,
                yMax: $scope.yMax,
                selected: _getSelected()
            });

//            setTimeout(function(){
//
//            }, 1);
//
//            if (!!window.Worker)
//            {
//            } else {
//
//            }
        };
    });