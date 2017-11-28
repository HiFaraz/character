'use strict';

/**
 * Module dependencies.
 */

// const debug = require('debug')('character:admin');

module.exports = function(Plugin) {
  return class Admin extends Plugin {
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
