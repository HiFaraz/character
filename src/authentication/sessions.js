'use strict';

export default {
  setup,
};

/**
 * Module dependencies.
 */

import SequelizeSessionStore from 'connect-session-sequelize';
import session from 'express-session';

/**
 * Prepares session middleware and methods without attaching to the stack
 *
 * @param {Object} config
 * @param {Object} database
 * @param {Object} [store] Store for `koa-generic-sessions`. Uses the database if a store is not provided
 * @return {Object}
 */
function setup(config, database, store) {
  let _store = store;

  if (!_store) {
    _store = new (SequelizeSessionStore(session.Store))({ db: database });
    _store.sync();
  }

  return {
    // session middleware
    session: session({
      maxAge: config.session.maxAge,
      name: 'identityDesk.sid',
      resave: false,
      saveUninitialized: false,
      secret: config.session.keys.split(','), // TODO document that the string is split by commas
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
