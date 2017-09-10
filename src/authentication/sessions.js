'use strict';

export default {
  setup,
};

/**
 * Module dependencies.
 */

import SequelizeSessionStore from 'connect-session-sequelize';
import { clone } from 'lodash';
import session from 'express-session';

/**
 * Prepares session middleware and methods without attaching to the stack
 *
 * @param {Object} config
 * @param {Object} db Sequelize database connection
 * @param {Object} [store] Store for `koa-generic-sessions`. Uses the database if a store is not provided
 * @return {Object}
 */
function setup(config, db, store) {
  const _config = clone(config);

  let _store = store;

  if (!_store) {
    _store = new (SequelizeSessionStore(session.Store))({ db });
    _store.sync();
  }

  _config.session.cookie.maxAge = Number(_config.session.cookie.maxAge);

  return {
    // session middleware
    session: session({
      cookie: _config.session.cookie,
      name: 'identityDesk.sid',
      resave: false,
      saveUninitialized: false,
      secret: _config.session.keys.split(','),
      store: _store,
    }),
    sessionMethods: function(req, res, next) {
      // attach session methods
      req.identityDesk = {
        get(key) {
          if (
            req.session &&
            req.session.identityDesk &&
            req.session.identityDesk[key] !== undefined
          ) {
            return req.session.identityDesk[key];
          } else {
            return undefined;
          }
        },
        set(values) {
          req.session = req.session || { identityDesk: values };
          req.session.identityDesk = req.session.identityDesk || values;
          Object.assign(req.session.identityDesk, values);
        },
      };

      return next();
    },
  };
}
