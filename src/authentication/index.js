import { and, assert } from '../utils';

export const config = {
  validate: data => and(
    assert(data.authenticators && Object.keys(data.authenticators).length > 0, 'missing authenticators'),
    ...Object.keys(data.authenticators).map(name => validateAuthenticator(name, data.authenticators[name])),
  ),
};

/**
 * Validate an authenticator
 *
 * @param {string} name Authenticator name
 * @param {Object} authenticator
 * @param {string} authenticator.module Module name
 * @param {string} authenticator.source Either `npm` or `local`
 * @param {string} [authenticator.path] Path of local authenticator module
 * @return {boolean}
 */
function validateAuthenticator(name, authenticator) {
  return (typeof authenticator === 'object') && and(
    assert(authenticator.module, `missing module for authenticator \`${name}\``),
    assert(authenticator.source, `missing source for authenticator \`${name}\`. Must be either \`npm\` or \`local\``),
    assert((authenticator.source === 'local') ? authenticator.path : true, `missing path for authenticator \`${name}\``)
  );
  // TODO: for source = local, check that we have a local copy of this file for future re-installs @ authenticator.path
}