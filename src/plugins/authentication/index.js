'use strict';

/**
 * Module dependencies.
 */
import { and, check } from '../../utils';
import {
  assign,
  flow,
  forEach,
  mapKeys,
  mapValues,
  merge,
  reduce,
} from 'lodash';
import CoreGETAuthenticator from './authenticator/get';
import CorePOSTAuthenticator from './authenticator/post';
import arrify from 'arrify';
import models from './models';
import modules from './modules';
import requests from './requests';
import sessions from './sessions';

const debug = require('debug')('character:authentication');

module.exports = function(CorePlugin) {
  return class Authentication extends CorePlugin {
    define() {
      if (!this.config.isValid) {
        return debug(
          'Invalid configuration. Not attaching authentication plugin. Fix the configuration and restart the server',
        );
      }

      /**
       * Make sure each authenticator has the following properties:
       *  - `authenticatorTargetParameter`
       *  - `failureRedirect`
       *  - `onboardKnownAccounts`
       *  - `successRedirect`
       */
      const authenticators = mapValues(
        this.config.authenticators,
        authenticator =>
          Object.assign(
            {
              authenticatorTargetParameter: this.config
                .authenticatorTargetParameter,
              failureRedirect: this.config.login,
              onboardKnownAccounts: this.config.onboardKnownAccounts,
              successRedirect: this.config.successRedirect,
            },
            authenticator,
          ),
      );

      // body parsing is currently enabled on all plugin router routes by `CoreFramework`

      // add session-middleware
      const { session, sessionMethods } = sessions.setup(
        this.config,
        this.deps.database.connection,
        this.deps.sessionStore,
      );
      this.preRouterMiddleware.push(sessionMethods); // adds `req.character.get/set` for safe access of Character session data
      this.postRouterMiddleware.push(session); // session purposely mounted on `/` for downstream routes, else internal requests to self will generate extra sessions

      // add request methods such as `req.isAuthenticated`
      this.preRouterMiddleware.push(requests.extend);

      // attach authenticators
      this.deps.session = session;
      forEach(modules.load(authenticators), (module, name) => {
        flow(
          module => module({ CoreGETAuthenticator, CorePOSTAuthenticator }), // hydrate the module,
          arrify, // modules may be a single authenticator or an array of authenticators
          modules =>
            modules.forEach(Module => {
              // TODO test ability to return multiple modules from an authenticator
              const config = merge({}, Module.defaults(), authenticators[name]); // apply the authenticator defaults
              const module = new Module(name, config, this.deps, this.events);
              // TODO do authenticator modules have root middleware as well? (pre- and post-router middleware)
              this.router.use(`/${name}`, module.router);
            }),
        )(module);
      });
    }

    static defaults() {
      return {
        authenticatorTargetParameter: 'character_target',
        base: '/auth',
        login: '/login',
        onboardKnownAccounts: true,
        successRedirect: '/',
      };
    }

    static models(config) {
      const result = reduce(
        modules.load(config.authenticators),
        (models, module, authenticatorName) =>
          assign(
            {},
            models,
            flow(
              module => module({ CoreGETAuthenticator, CorePOSTAuthenticator }), // hydrate the module,
              arrify, // modules may be a single authenticator or an array of authenticators
              modules => modules.map(Module => Module.models()),
              models => assign({}, ...models),
              models =>
                mapKeys(
                  models,
                  (model, modelName) => `${authenticatorName}$${modelName}`, // insert the model into the authenticator models namespace
                ),
            )(module),
          ),
        models,
      );
      return result;
    }

    static name() {
      return 'authentication';
    }

    static validateConfig(data) {
      const config = data.plugins.authentication;
      return and(
        check(config, 'missing authentication settings'),
        check(
          config.authenticators &&
            Object.keys(config.authenticators).length > 0,
          'missing authenticators',
        ),
        ...Object.keys(config.authenticators).map(name =>
          validateAuthenticator(name, config.authenticators[name]),
        ),
        check(
          config.session.cookie.maxAge,
          'missing session cookie maximum age',
        ),
        check(config.session.keys, 'missing session secret keys'),
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
      check(
        authenticator.module,
        `missing module for authenticator \`${name}\``,
      ),
      check(
        authenticator.source,
        `missing source for authenticator \`${
          name
        }\`. Must be either \`npm\` or \`local\``,
      ),
      check(
        authenticator.source === 'local' ? authenticator.path : true,
        `missing path for authenticator \`${name}\``,
      ),
    )
  );
  // TODO: for source = local, check that we have a local copy of this file for future re-installs @ authenticator.path
}