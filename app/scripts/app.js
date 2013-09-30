'use strict';
angular.module('gol', ['gol.controllers'])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

