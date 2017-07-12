'use strict';

export default {
  setup,
};

/**
 * Module dependencies.
 */

import SequelizeStore from 'koa-generic-session-sequelize';
// import convert from 'koa-convert';
import session from 'koa-generic-session';

/**
 * Prepares session middleware and methods without attaching to the stack
 *
 * @param {Object} settings
 * @param {Object} database
 * @param {Object} [store] Store for `koa-generic-sessions`. Uses the database if a store is not provided
 * @return {Object}
 */
function setup(settings, database, store) {
  return {
    // session middleware
    session: session({
      key: 'identityDesk.sid',
      store: store || new SequelizeStore(database),
    }),
    sessionMethods: function(ctx, next) {
      // set the secret keys for Keygrip
      ctx.app.keys = settings.session.keys;

      // attach session methods
      ctx.identityDesk = {
        get(key) {
          if (ctx.session && ctx.session.identityDesk && ctx.session.identityDesk[key] !== undefined) {
            return ctx.session.identityDesk[key];
          } else {
            return undefined;
          }
        },
        set(values) {
          ctx.session = ctx.session || { identityDesk: { values } };
          ctx.session.identityDesk = ctx.session.identityDesk || { values };
          Object.assign(ctx.session.identityDesk, values);
        },
      };

      return next();
    },
  };
}