/**
 * Common code required at all entry-points
 */

'use strict';

/**
 * Module dependencies.
 */

if (!global._babelPolyfill) { require('babel-polyfill'); } // acknowledgement: https://github.com/feathersjs/feathers-sequelize/issues/3
import 'source-map-support/register';
import { addPath } from 'app-module-path';
import path from 'path';

// Register the codebase root folder on the module import/require path
addPath(path.resolve(__dirname, '../../lib'));