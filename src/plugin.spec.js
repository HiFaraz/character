'use strict';

import Plugin from './plugin';
import assert from 'assert';

describe('Plugin class', () => {
  it('define should throw error (called by constructor)', () => {
    try {
      new Plugin();
      throw new Error();
    } catch (error) {
      assert(error.message === 'Plugin#define must be overridden by subclass');
    }
  });
});
