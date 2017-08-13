'use strict';

/**
 * Module dependencies.
 */

import { Router } from 'express';
import { clone } from 'lodash';

module.exports = class CorePlugin {
  /**
   * @param {Object} config
   * @param {Object} dependencies
   */
  constructor(config, dependencies) {
    this.config = clone(config);
    this.dependencies = dependencies;
    this.preRouterMiddleware = []; // not part of the router, is mounted directly to the root app
    this.router = Router(); // is mounted to the base path
    this.postRouterMiddleware = []; // not part of the router, is mounted directly to the root app

    this.define();
  }

  /**
   * Override this to return your plugin defaults
   *
   * @return {Object}
   */
  static defaults() {
    return {};
  }

  /**
   * Override this with your router configuration
   * Do not put your router configuration in the constructor
   */
  define() {
    // Example: this.router.use(...)
  }

  /**
   * Override this to return your plugin name
   *
   * @return {string}
   */
  static name() {
    return '';
  }

  /**
   * Override this with your validator function
   *
   * @param {Object} data
   * @return {Boolean}
   */
  static validateConfig(data) {
    return true;
  }
};
