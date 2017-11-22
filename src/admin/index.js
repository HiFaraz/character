'use strict';

/**
 * Module dependencies.
 */
// import { and, check } from '../utils';

// const debug = require('debug')('identity-desk:admin');

module.exports = function(CorePlugin) {
  return class Admin extends CorePlugin {
    define() {
      this.router.get('/', (req, res) => {
        res.send('You are in the admin area!');
      });
    }

    static defaults() {
      return {
        base: '/admin',
      };
    }

    static name() {
      return 'admin';
    }
  };
};
