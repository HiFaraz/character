'use strict';

const Plugin = require('../lib/plugin');
const assert = require('assert');

const character = {
  database: {},
};

describe('Plugin', () => {
  describe('defaults', () => {
    it('should return an object', () => {
      assert(typeof Plugin.defaults() === 'object');
    });
  });

  describe('models', () => {
    it('should return an object', () => {
      assert(typeof Plugin.models() === 'object');
    });
  });

  describe('#define', () => {
    it('should throw error (called by constructor)', () => {
      try {
        new Plugin({}, {}, character);
        throw new Error();
      } catch (error) {
        assert(
          error.message === 'Plugin#define must be overridden by subclass',
        );
      }
    });
  });

  describe('#validateConfig', () => {
    it('should return true', () => {
      class MyPlugin extends Plugin {
        define() {} // override define() to avoid error
      }
      assert(new MyPlugin({}, {}, character).validateConfig() === true);
    });
  });
});
