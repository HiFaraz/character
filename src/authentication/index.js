'use strict';

/**
 * Module dependencies.
 */
import { and, assert } from '../utils';
import CoreGETAuthenticator from './authenticator/get';
import CorePOSTAuthenticator from './authenticator/post';
import { flow } from 'lodash';
import modules from './modules';
import requests from './requests';
import sessions from './sessions';

const debug = require('debug')('identity-desk:authentication');

module.exports = function(CorePlugin) {
  return class Authentication extends CorePlugin {

    defineRoutes() {
      if (!this.settings.isValid) {
        return debug('Invalid configration. Not attaching authenticator middleware. Fix your configuration and restart the server');
      }

      // body parsing is currently enabled on all routes by `CoreFramework`
      // in the future it might make sense to enable it here on select routes

      // add request methods such as `req.isAuthenticated`
      this.rootMiddleware.push(requests.extend);
      this.router.use(requests.extend);

      // `session` is session-middleware to be attached in front of certain authenticator routes
      // also adds `ctx.identityDesk.get/set` for safe access of Identity Desk session data
      const session = sessions.setup(this.router, this.settings, this.dependencies.database, this.dependencies.store);

      // attach authenticators
      modules.load(this.settings.authenticators).forEach(flow(
        ([name, module]) => [name, (module) ? module({ CoreGETAuthenticator, CorePOSTAuthenticator }) : module],
        ([name, Module]) => {
          const base = `/${name}`;
          const module = new Module(name, this.settings, this.dependencies);
          this.router.use(base, module.router.routes());
          this.router.use(base, module.router.allowedMethods());
        },
      ));

      // session purposely mounted on `/` for downstream routes
      this.router.use(session);
      this.router.use((ctx, next) => next()); // TODO added this because Koa example app's middleware was not getting triggered. Keep this here for debugging for now but find a better way later
    }

    static validateConfig(data) {
      return and(
        assert(data.authenticators && Object.keys(data.authenticators).length > 0, 'missing authenticators'),
        ...Object.keys(data.authenticators).map(name => validateAuthenticator(name, data.authenticators[name])),
        assert(data.session.keys, 'missing session secret keys'),
      );
    }

    // no defaults

  };
};

/**
 * Validate an authenticator
 *
 * @param {string} name Authenticator name
 * @param {Object} authenticator
 * @param {string} authenticator.module Module name
 * @param {string} authenticator.source Either `npm` or `local`
 * @param {string} [authenticator.path] Path of local authenticator module
 * @return {Boolean}
 */
function validateAuthenticator(name, authenticator) {
  return (typeof authenticator === 'object') && and(
    assert(authenticator.module, `missing module for authenticator \`${name}\``),
    assert(authenticator.source, `missing source for authenticator \`${name}\`. Must be either \`npm\` or \`local\``),
    assert((authenticator.source === 'local') ? authenticator.path : true, `missing path for authenticator \`${name}\``)
  );
  // TODO: for source = local, check that we have a local copy of this file for future re-installs @ authenticator.path
}