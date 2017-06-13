'use strict';

/**
 * Module dependencies.
 */

import Koa from 'koa';
import Router from 'koa-router';
import { assert } from '../../utils';
import bodyParser from './koa-bodyparser'; // local copy so that it can get transpiled for Node < 7.6 support
import mount from './koa-mount'; // local copy so that it can get transpiled for Node < 7.6 support
import path from 'path';
import read from 'read-data';

const debug = require('debug')('identity-desk:core:framework');

module.exports = class CoreFramework {

  /**
   * @param {Object} database
   * @param {Object} settings
   * @param {Array} [plugins=[]]
   */
  constructor(database, settings, plugins = []) {
    debug(`initializing with ${plugins.length} plugins`);

    this.settings = settings;

    this._app = new Koa();
    const router = new Router();

    // expose the database
    router.use(async function(ctx, next) {
      ctx.database = database;
      await next();
    });

    // load plugins
    plugins.forEach(plugin => {
      router.use(plugin.routes());
      router.use(plugin.allowedMethods());
    });

    // put it all together
    this._app.use(bodyParser());
    this._app.use(router.routes());
    this._app.use(router.allowedMethods());
  }

  app() {
    return mount(this.settings.base, this._app);
  }

  /**
   * Express/Connect-compatible middleware
   *
   * @returns {Object}
   */
  callback() {
    return this._app.callback();
  }

  static config() {
    return {
      validate: data => assert(data.session.secret, 'missing environment variable reference for session secret key'),
    };
  }

  static defaults() {
    return read.sync(path.resolve(__dirname, './defaults.yml'));
  }
};