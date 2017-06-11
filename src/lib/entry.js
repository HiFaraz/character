/**
 * Common code required at all entry-points
 *
 * @module
 */
'use strict';

/**
 * Modules
 */
import 'babel-polyfill';
import 'source-map-support/register';
import { addPath } from 'app-module-path';
import path from 'path';

// Register the codebase root folder on the module import/require path
addPath(path.resolve(__dirname, '../../dist'));