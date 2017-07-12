'use strict';

/**
 * Module dependencies.
 */

import Router from 'koa-router';
import { asyncEnabled } from '../utils';
import { clone } from 'lodash';
import compose from 'koa-compose';
import expressify from 'expressify-koa';
import path from 'path';
import read from 'read-data';
import statuses from 'statuses';

/**
 * Safely require a module which requires Node v7.6+. Falls back to a local copy
 *
 * @param {string} module
 * @returns {*}
 */
const asyncSafeRequire = module => require((asyncEnabled() ? '' : './vendor/') + module);

const bodyParser = asyncSafeRequire('koa-bodyparser');

const debug = require('debug')('identity-desk:core:framework');

module.exports = class CoreFramework {

  /**
   * @param {Object} database
   * @param {Object} settings
   * @param {Object[]} [plugins=[]] Array of koa-router instances
   */
  constructor(database, settings, plugins = []) {
    debug(`initializing with ${plugins.length} plugins`);

    this.settings = clone(settings);

    this.preRouterMiddleware = []; // not part of the router, is added directly to the root app
    this.router = new Router();
    this.postRouterMiddleware = []; // not part of the router, is added directly to the root app

    // this.routes is the root app, needs to next into the root app
    // this.router is only for ID routes, will not need to next into the root app
    // in the end, use compose([...this.preRouterMiddleware, this.router.routes(), this.router.allowedMethods(), ...this.postRouterMiddleware])

    this.router.use((ctx, next) => {
      ctx.res.sendStatus = code => {
        ctx.status = code;

        // ignore body on certain codes
        if (statuses.empty[code]) {
          // strip headers
          ctx.body = null;
        }
        ctx.res.end();
      };
      next();
    });

    this.router.use(bodyParser());

    // load plugins
    plugins.forEach(plugin => {
      this.preRouterMiddleware.push(...plugin.preRouterMiddleware);
      this.router.use(this.settings.base, plugin.router.routes());
      this.router.use(this.settings.base, plugin.router.allowedMethods());
      this.postRouterMiddleware.push(...plugin.postRouterMiddleware);
    });
  }

  /**
   * Override this with your app property, which is served by the core module as identityDesk.app
   *
   * @return {Object}
   */
  get app() {
    return compose([...this.preRouterMiddleware, this.router.routes(), this.router.allowedMethods(), ...this.postRouterMiddleware]);
  }

  static defaults() {
    return read.sync(path.resolve(__dirname, './defaults.yml'));
  }


  /**
   * Express/Connect-compatible middleware
   *
   * @returns {function}
   */
  expressify() {
    return expressify(compose([...this.preRouterMiddleware, this.router.routes(), this.router.allowedMethods(), ...this.postRouterMiddleware])); // do not rely on `this.app` since higher-level frameworks will overwrite it
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