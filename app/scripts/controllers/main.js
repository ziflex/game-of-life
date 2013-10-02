'use strict';
angular.module('gol.controllers', ['gol.services'])
    .controller('MainCtrl', function ($scope, $game, $gameEvents) {
        /// <summary>
        /// Private properties
        /// </summary>
        var _startTime,
            _endTime,
            _resultTime,
            _selected = {};

        /// <summary>
        /// Private methods
        /// </summary>
        var _getIndexOf = function (x, y) {
                return x + '_' + y;
            },
            _onCellEvent = function (eventName, options) {
                switch(event.event){
                    case $gameEvents.onCellAlive:
                        break;
                    case $gameEvents.onCellDead:
                        break;
                    default:
                        break;
                }
            },
            _getElementByXY = function (x, y) {

            };

        $scope.isDisabled = false;
        $scope.selected = {};
        $scope.range = function (num) {
            return new Array(num);
        };
        $scope.onCellClick = function (el) {
            var id = _getIndexOf(el.$index, el.$parent.$index);
            el.selected = !el.selected;

            // weird... revert logic..
            if (!el.selected) {
                _selected[id] = {
                    x: el.$index,
                    y: el.$parent.$index
                };
            } else {
                if (_selected[id]) {
                    delete _selected[id];
                }
            }
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
                selected: _selected
            });
        };
    });