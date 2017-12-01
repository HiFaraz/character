'use strict';

import Plugin from './plugin';
import assert from 'assert';

describe('Plugin class', () => {
  it('defaults should return an object', () => {
    assert(typeof Plugin.defaults() === 'object');
  });

  it('models should return an object', () => {
    assert(typeof Plugin.models() === 'object');
  });

  it('name should return an empty string', () => {
    assert(Plugin.name() === '');
  });

  it('validateConfig should return true', () => {
    assert(Plugin.validateConfig() === true);
  });

  it('#define should throw error (called by constructor)', () => {
    try {
      new Plugin();
      throw new Error();
    } catch (error) {
      assert(error.message === 'Plugin#define must be overridden by subclass');
    }
  });
});
