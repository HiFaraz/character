'use strict';

/**
 * Module dependencies.
 */

import { Router } from 'express';
import { clone } from 'lodash';

module.exports = class Plugin {
  /**
   * Do not override the constructor, use #define instead
   *
   * @param {Object} config Plugin configuration (not top-level configuration)
   * @param {Object} database
   * @param {Object} deps
   * @param {Object} events Top-level event emitter for communication across plugins
   */
  constructor(config, database, deps, events) {
    this.config = clone(config);
    this.database = database;
    this.deps = deps;
    this.events = events;
    this.preRouterMiddleware = []; // not part of the router, is mounted directly to the root app
    this.router = Router(); // is mounted to the base path
    this.postRouterMiddleware = []; // not part of the router, is mounted directly to the root app

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

  /**
   * Override this with validator function
   *
   * @param {Object} data
   * @return {Boolean}
   */
  static validateConfig(data) {
    return true;
  }
};
