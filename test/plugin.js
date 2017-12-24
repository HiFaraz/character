'use strict';

const Plugin = require('../lib/plugin');
const assert = require('assert');

const character = {
  database: {},
};

describe('Plugin class', () => {
  it('defaults should return an object', () => {
    assert(typeof Plugin.defaults() === 'object');
  });

  it('models should return an object', () => {
    assert(typeof Plugin.models() === 'object');
  });

  it('name should return the class name', () => {
    class MyPlugin extends Plugin {
      define() {} // override define() to avoid error
    }
    assert(MyPlugin.name === 'MyPlugin');
  });

  it('validateConfig should return true', () => {
    class MyPlugin extends Plugin {
      define() {} // override define() to avoid error
    }
    assert(new MyPlugin({}, {}, character).validateConfig() === true);
  });

  it('#define should throw error (called by constructor)', () => {
    try {
      new Plugin({}, {}, character);
      throw new Error();
    } catch (error) {
      assert(error.message === 'Plugin#define must be overridden by subclass');
    }
  });
});
