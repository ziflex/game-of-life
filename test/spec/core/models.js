'use strict';

describe('Core.models: $hash', function () {

//  // load the controller's module
//  beforeEach(module('gol'));

  var $hash;

  beforeEach(GameOfLife.register('$test$hash', '$hash', function ($hashInjected) {
      $hash = $hashInjected;
  }));

  it('$hash.add(): should has 3 object', function () {
      var data = $hash();
      data.add('a');
      data.add('b');
      data.add('c');

    expect(data.count()).toBe(3);
  });
});
