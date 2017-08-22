'use strict';

/**
 * Module dependencies.
 */

import { UNAUTHORIZED } from 'http-codes';
import models from './models';

module.exports = function({ CorePOSTAuthenticator }) {
  return class LocalAuthenticator extends CorePOSTAuthenticator {
    hubToAuthenticator() {
      const debug = this.debug;
      const dependencies = this.dependencies;

      return async (req, res, next) => {
        try {
          const { username, password } = req.body;
          debug(`authenticating username ${username} and password ${password}`);

          const { Authentication$Local$User } = dependencies.database.models;

          const user = await Authentication$Local$User.findOne({
            attributes: ['id', 'password'],
            raw: true,
            where: { username },
          });

          if (user) {
            const { id, password: actualPassword } = user;

            // Mock authentication code
            // TODO replace with bcrypt
            if (password === actualPassword) {
              // success
              res.send({ id });
            } else {
              // bad password
              res.sendStatus(UNAUTHORIZED);
            }
          } else {
            // user not found
            res.sendStatus(UNAUTHORIZED);
          }
        } catch (error) {
          debug('error within local authenticator', error.message);
          throw error;
        }
      };
    }

    static models() {
      return models;
    }
  };
};
