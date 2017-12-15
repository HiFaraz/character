'use strict';

/**
 * Module dependencies.
 */

import { Router } from 'express';
import { merge } from 'lodash';

module.exports = class Plugin {
  /**
   * Do not override the constructor, use #define instead
   *
   * @param {Object} config Plugin configuration (not top-level configuration)
   * @param {Object} deps
   * @param {Object} character Reference to parent Character instance
   */
  constructor(config, deps, character) {
    this.config = merge({}, this.constructor.defaults(), config);
    this.character = character;
    this.deps = deps;
    this.preRouterMiddleware = []; // not part of the router, is mounted directly to the root app
    this.router = Router(); // is mounted to the base path
    this.postRouterMiddleware = []; // not part of the router, is mounted directly to the root app

    this.config.isValid = this.validateConfig(this.config);

    this.define();
  }

  /**
   * Override this with a function to define router configuration
   */
  define() {
    // Example: this.router.use(...)
    throw new Error('Plugin#define must be overridden by subclass');
  }

  /**
   * Override this with validator function
   *
   * @param {Object} data
   * @return {Boolean}
   */
  validateConfig(data) {
    return true;
  }

  /**
   * Override this to return plugin defaults
   *
   * @return {Object}
   */
  static defaults() {
    return {
      base: '', // the base mount path for the plugin router
    };
  }

  /**
   * Override this to return plugin models
   *
   * @param {Object} config Plugin configuration
   * @return {Object}
   */
  static models(config) {
    /**
     * Each model must implement some or all of the standard interface below
     *
     * Example code:
     *
     * return {
     *   modelName: {
     *     associate: models => {},
     *     attributes: {},
     *     define: Model => {},
     *     options: {},
     *   },
     * }
     */
    return {};
  }

  /**
   * Override this to return plugin name
   *
   * @return {string}
   */
  static name() {
    return '';
  }
};
