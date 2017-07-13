'use strict';

/**
 * Module dependencies.
 */

import { UNAUTHORIZED } from 'http-codes';

module.exports = function({ CorePOSTAuthenticator }) {
  return class MockLocalAuthenticator extends CorePOSTAuthenticator {

    hubToAuthenticator() {

      const debug = this.debug;

      return (ctx, next) => {
        const { username, password } = ctx.request.body;
        debug(`authenticating username ${username} and password ${password}`);

        // Mock authentication code
        if (username === 'foo' && password === 'bar') {
          ctx.body = username;
        } else {
          ctx.res.sendStatus(UNAUTHORIZED);
        }
      };
    }

  };
};