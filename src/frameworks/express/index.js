'use strict';

/**
 * Module dependencies.
 */

import express from 'express';

module.exports = function(CoreFramework) {
  return class Express extends CoreFramework {
    app() {
      return express.Router().use(this.expressify());
    }
  };
};