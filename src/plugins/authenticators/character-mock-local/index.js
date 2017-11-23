'use strict';

/**
 * Module dependencies.
 */
import { UNAUTHORIZED } from 'http-codes';

module.exports = function({ CorePOSTAuthenticator }) {
  return class MockLocalAuthenticator extends CorePOSTAuthenticator {
    /**
     * Handles requests from the hub to the authenticator
     *
     * @param {Object} context
     * @param {IncomingMessage} context.req
     * @param {ServerResponse} context.res
     * @return {Promise<Object>}
     */
    authenticate({ req, res }) {
      const { username, password } = req.body;
      this.debug(
        `authenticating username ${username} and password ${password}`,
      );

      // Mock authentication code
      if (username === 'foo' && password === 'bar') {
        return {
          account: {
            id: 1,
          },
          req,
          res,
        };
      } else {
        const error = new Error('Unable to authenticate');
        error.httpStatusCode = UNAUTHORIZED;
        throw error;
      }
    }
  };
};
