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
      name: 'character.sid',
      resave: false,
      saveUninitialized: false,
      secret: _config.session.keys.split(','),
      store: _store,
    }),
    sessionMethods: function(req, res, next) {
      // attach session methods
      req.character = {
        get(key) {
          if (
            req.session &&
            req.session.character &&
            req.session.character[key] !== undefined
          ) {
            return req.session.character[key];
          } else {
            return undefined;
          }
        },
        set(values) {
          req.session = req.session || { character: values };
          req.session.character = req.session.character || values;
          Object.assign(req.session.character, values);
        },
      };

      return next();
    },
  };
}
