'use strict';

const { and } = require('./utils');
const assert = require('assert');

describe('The utility module', () => {
  it('provides a logical AND method', () => {
    assert(and(true));
    assert(and(true, true));
    assert(and(true, false) === false);
    assert(and(true, null) === false);
    assert(and(true, undefined) === false);
  });
});
