/**
 * Common code required at all entry-points
 *
 * @module
 */
'use strict';

import 'babel-polyfill';
import 'source-map-support/register';

// Register the codebase root folder on the module import/require path
import { addPath } from 'app-module-path';
import path from 'path';
addPath(path.resolve(__dirname, '../../dist'));