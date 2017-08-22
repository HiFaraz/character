'use strict';

/**
 * Module dependencies.
 */
import { clone, forEach } from 'lodash';
import { Router } from 'express';
import capitalize from 'capitalize';

module.exports = class CoreAuthenticator {
  /**
   * Do not override the constructor
   * 
   * @param {string} name
   * @param {Object} config
   * @param {Object} dependencies
   */
  constructor(name, config, dependencies) {
    this.debug = require('debug')(
      `identity-desk:authentication:authenticator:${name}`,
    );
    this.dependencies = dependencies;
    this.name = name;
    this.router = Router();
    this.config = clone(config);

    this.debug('initializing');

    this.attachModels();
    this.define();
  }

  /**
   * Attach authenticator models to the context for easy access
   */
  attachModels() {
    const prefix = `Authentication$${capitalize(this.name)}$`;
    this.models = {};
    forEach(this.dependencies.database.models, (model, name) => {
      if (name.startsWith(prefix)) {
        this.models[name.slice(prefix.length)] = model;
      }
    });
  }

  /**
   * Define generic routes
   * 
   * Override this to define authenticator routes
   */
  define() {
    /**
     * Example code:
     * 
     * this.router.post(...);
     */
  }

  /**
   * Define authenticator models
   * 
   * Override this to return authenticator models
   * 
   * @return {Object}
   */
  static models() {
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
};
