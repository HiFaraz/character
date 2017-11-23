'use strict';

/**
 * Module dependencies.
 */
import { clone, forEach } from 'lodash';
import { Router } from 'express';
import capitalize from 'capitalize';

module.exports = class CoreGenericAuthenticator {
  /**
   * Do not override the constructor
   *
   * @param {string} name
   * @param {Object} config
   * @param {Object} deps
   * @param {Object} events
   */
  constructor(name, config, deps, events) {
    this.debug = require('debug')(
      `character:authentication:authenticator:${name}`,
    );
    this.deps = deps;
    this.events = events;
    this.name = name;
    this.router = Router();
    this.config = clone(config);

    this.debug('initializing');

    this.attachModels();
    this.define();
    this.extend();
  }

  /**
   * Attach authenticator models to the context for easy access
   */
  attachModels() {
    const prefix = `Authentication$${capitalize(this.name)}$`;
    this.models = {};
    forEach(this.deps.database.models, (model, name) => {
      if (name.startsWith(prefix)) {
        this.models[name.slice(prefix.length)] = model;
      }
    });
  }

  /**
   * Define core routes
   *
   * Override this to define core routes
   */
  define() {
    /**
     * Example code:
     *
     * this.router.post(...);
     */
  }

  /**
   * Define extra authenticator routes
   *
   * Override this to define extra authenticator routes
   */
  extend() {
    /**
     * Example code:
     *
     * this.router.post(...);
     */
  }

  /**
   * Find the core identity linked to an authenticator account
   *
   * @param {Object} account
   * @param {integer} account.id
   * @return {Promise<Object>}
   */
  findIdentity(account) {
    // TODO similar to authenticators, make it easier for plugins to access their own models. Create this in `CorePlugin`
    const { Authentication$Account, Core$Identity } = this.deps.database.models;
    return Core$Identity.findOne({
      attributes: ['id'],
      include: [
        {
          attributes: [],
          model: Authentication$Account,
          where: {
            authenticatorAccountId: account.id, // authenticator must return an id
            authenticatorName: this.name,
          },
        },
      ],
      raw: true,
    });
  }

  /**
   * Create a new core identity linked to an authenticator account
   *
   * @param {Object} account
   * @param {integer} account.id
   * @return {Promise<Object>}
   */
  async onboard(account) {
    // TODO similar to authenticators, make it easier for plugins to access their own models. Create this in `CorePlugin`
    const { Authentication$Account, Core$Identity } = this.deps.database.models;
    const identity = (await Core$Identity.create(
      {
        authentication$Accounts: [
          {
            authenticatorAccountId: account.id,
            authenticatorName: this.name,
          },
        ],
      },
      {
        include: [Authentication$Account],
      },
    )).get({ plain: true });
    this.events.emit('authentication:onboard', {
      account,
      datetime: new Date(),
      identity,
    });
    return identity;
  }

  /**
   * Override this to return authenticator defaults
   *
   * @return {Object}
   */
  static defaults() {
    return {};
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
