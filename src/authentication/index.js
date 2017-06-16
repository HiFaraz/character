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

    define() {
      if (!this.settings.isValid) {
        return debug('Invalid configration. Not attaching authenticator middleware. Fix your configuration and restart the server');
      }

      // body parsing is currently enabled on all plugin router routes by `CoreFramework`

      // add request methods such as `req.isAuthenticated`
      this.preRouterMiddleware.push(requests.extend);

      // add session-middleware
      // also adds `ctx.identityDesk.get/set` for safe access of Identity Desk session data
      const { session, sessionMethods } = sessions.setup(this.settings, this.dependencies.database, this.dependencies.store);
      this.dependencies.session = session;
      this.preRouterMiddleware.push(sessionMethods);

      // attach authenticators
      modules.load(this.settings.authenticators).forEach(flow(
        ([name, module]) => [name, (module) ? module({ CoreGETAuthenticator, CorePOSTAuthenticator }) : module],
        ([name, Module]) => {
          const base = `/${name}`;
          const module = new Module(name, this.settings, this.dependencies);
          // TODO do authenticator modules have root middleware as well?
          this.router.use(base, module.router.routes());
          this.router.use(base, module.router.allowedMethods());
        },
      ));

      // session purposely mounted on `/` for downstream routes
      this.postRouterMiddleware.push(session);
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