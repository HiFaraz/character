'use strict';

/**
 * Module dependencies.
 */

import assert from 'assert';
import config from './config';

describe('config', () => {
  describe('safeGetEnvString', () => {
    it('should get an existing environment variable', () => {
      process.env.CHARACTER_TEST_VARIABLE = 'foo ';
      assert.strictEqual(
        config._safeGetEnvString('$CHARACTER_TEST_VARIABLE'),
        'foo',
      ); // the result is trimmed
      delete process.env.CHARACTER_TEST_VARIABLE;
    });

    it('should return `undefined` for a non-existing environment variable', () => {
      assert.strictEqual(
        config._safeGetEnvString('$CHARACTER_TEST_VARIABLE_2'),
        undefined,
      );
    });

    it('should ignore plain strings which do not look like $ENV_VARIABLES', () => {
      assert.strictEqual(
        config._safeGetEnvString('random string '),
        'random string ',
      );
    });
  });
});
