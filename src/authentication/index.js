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

    static defaults() {
      return {
        authenticatorTargetParameter: 'identity_desk_target',
        login: '/login',
      };
    }

    define() {
      if (!this.settings.isValid) {
        return debug('Invalid configration. Not attaching authenticator middleware. Fix your configuration and restart the server');
      }

      const authenticators = this.settings.authenticators;

      // make sure each authenticator has a `successRedirect` and `failureRedirect` property
      Object.keys(authenticators).forEach(name => {
        authenticators[name] = Object.assign({
          authenticatorTargetParameter: this.settings.authenticatorTargetParameter,
          failureRedirect: this.settings.login,
          successRedirect: this.settings.successRedirect,
        }, authenticators[name]);
      });

      // body parsing is currently enabled on all plugin router routes by `CoreFramework`

      // add session-middleware
      const { session, sessionMethods } = sessions.setup(this.settings, this.dependencies.database, this.dependencies.store);
      this.preRouterMiddleware.push(sessionMethods); // adds `ctx.identityDesk.get/set` for safe access of Identity Desk session data
      this.postRouterMiddleware.push(session); // session purposely mounted on `/` for downstream routes

      // add request methods such as `req.isAuthenticated`
      this.preRouterMiddleware.push(requests.extend);

      // attach authenticators
      this.dependencies.session = session;
      modules.load(authenticators).forEach(flow(
        ([name, module]) => [name, (module) ? module({ CoreGETAuthenticator, CorePOSTAuthenticator }) : module],
        ([name, Module]) => {
          const base = `/${name}`;
          const module = new Module(name, authenticators[name], this.dependencies);
          // TODO do authenticator modules have root middleware as well?
          this.router.use(base, module.router.routes());
          this.router.use(base, module.router.allowedMethods());
        },
      ));
    }

    static validateConfig(data) {
      return and(
        assert(data.authenticators && Object.keys(data.authenticators).length > 0, 'missing authenticators'),
        ...Object.keys(data.authenticators).map(name => validateAuthenticator(name, data.authenticators[name])),
        assert(data.session.keys, 'missing session secret keys'),
      );
    }

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