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
      if (!this.config.isValid) {
        return debug(
          'Invalid configration. Not attaching authentication plugin. Fix your configuration and restart the server',
        );
      }

      const authenticators = this.config.authenticators;

      // make sure each authenticator has a `successRedirect` and `failureRedirect` property
      Object.keys(authenticators).forEach(name => {
        authenticators[name] = Object.assign(
          {
            authenticatorTargetParameter: this.config
              .authenticatorTargetParameter,
            failureRedirect: this.config.login,
            successRedirect: this.config.successRedirect,
          },
          authenticators[name],
        );
      });

      // body parsing is currently enabled on all plugin router routes by `CoreFramework`

      // add session-middleware
      const { session, sessionMethods } = sessions.setup(
        this.config,
        this.dependencies.database,
        this.dependencies.sessionStore,
      );
      this.preRouterMiddleware.push(sessionMethods); // adds `req.identityDesk.get/set` for safe access of Identity Desk session data
      this.postRouterMiddleware.push(session); // session purposely mounted on `/` for downstream routes, else internal requests to self will generate extra sessions

      // add request methods such as `req.isAuthenticated`
      this.preRouterMiddleware.push(requests.extend);

      // attach authenticators
      this.dependencies.session = session;
      modules.load(authenticators).forEach(
        flow(
          ([name, module]) => [
            name,
            module
              ? module({ CoreGETAuthenticator, CorePOSTAuthenticator })
              : module,
          ],
          ([name, Module]) => {
            const base = `/${name}`;
            const module = new Module(
              name,
              authenticators[name],
              this.dependencies,
            );
            // TODO do authenticator modules have root middleware as well? (pre- and post-router middleware)
            this.router.use(base, module.router);
          },
        ),
      );
    }

    static name() {
      return 'authentication';
    }

    static validateConfig(data) {
      const config = data.plugins.authentication;
      return and(
        assert(config, 'missing authentication settings'),
        assert(
          config.authenticators &&
            Object.keys(config.authenticators).length > 0,
          'missing authenticators',
        ),
        ...Object.keys(config.authenticators).map(name =>
          validateAuthenticator(name, config.authenticators[name]),
        ),
        assert(config.session.maxAge, 'missing session maximum age'),
        assert(config.session.keys, 'missing session secret keys'),
      );
      // TODO check that config.successRedirect exists or that each authenticator has a successRedirect
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
  return (
    typeof authenticator === 'object' &&
    and(
      assert(
        authenticator.module,
        `missing module for authenticator \`${name}\``,
      ),
      assert(
        authenticator.source,
        `missing source for authenticator \`${name}\`. Must be either \`npm\` or \`local\``,
      ),
      assert(
        authenticator.source === 'local' ? authenticator.path : true,
        `missing path for authenticator \`${name}\``,
      ),
    )
  );
  // TODO: for source = local, check that we have a local copy of this file for future re-installs @ authenticator.path
}
