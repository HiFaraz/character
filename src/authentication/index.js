'use strict';

/**
 * Module dependencies.
 */
import { and, assert } from '../utils';

const debug = require('debug')('identity-desk:authentication');

module.exports = function(CorePlugin) {
  return class Authentication extends CorePlugin {

    defineRoutes() {
      if (!this.settings.isValid) {
        return debug('Not attaching middleware. Fix your config and restart the server');
      }

      // body parsing is currently enabled on all routes by `CoreFramework`
      // in the future it might make sense to enable it here on select routes

      this.router.use((ctx, next) => {
        ctx.req.isAuthenticated = () => true;
        ctx.req.logout = () => ctx.res.redirect('/');
      });
    }

    static validateConfig(data) {
      return and(
        assert(data.authenticators && Object.keys(data.authenticators).length > 0, 'missing authenticators'),
        ...Object.keys(data.authenticators).map(name => validateAuthenticator(name, data.authenticators[name])),
        assert(data.session.secret, 'missing environment variable reference for session secret key'),
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