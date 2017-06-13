/**
 * Common code required at all entry-points
 */

'use strict';

/**
 * Module dependencies.
 */

if (!global._babelPolyfill) { require('babel-polyfill'); } // acknowledgement: https://github.com/feathersjs/feathers-sequelize/issues/3
import 'source-map-support/register';