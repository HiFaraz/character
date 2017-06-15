'use strict';

/**
 * Module dependencies.
 */
import { and, assert } from '../utils';
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
      this.router.use(requests.extend);

      // `session` is session-middleware to be attached in front of certain authenticator routes
      // also adds `ctx.identityDesk.get/set` for safe access of Identity Desk session data
      const session = sessions.setup(this.router, this.settings, this.dependencies.database, this.dependencies.store);

      // attach authenticators

      this.router.use(session);
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