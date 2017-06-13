/**
 * Session middleware and methods
 *
 * @module
 */

'use strict';

export default {
  attach,
  setup,
};

/**
 * Modules
 */
import sequelizeStore from 'connect-session-sequelize';
import session from 'express-session';

/**
 * Attach session middleware
 *
 * @param {Object} app Express app
 * @alias module:frameworks/express/lib/sessions.attach
 */
function attach(app) {
  app.use(app.locals.identityDesk.session);
}


/**
 * Attach session methods
 *
 * @param {Object} app Expres app
 */
function attachMethods(app) {
  // add a safe method to `res.locals.setSessionData` for setting Identity Desk session data
  app.use((req, res, next) => {
    res.locals.setSessionData = values => {
      req.session = req.session || { identityDesk: { values } };
      req.session.identityDesk = req.session.identityDesk || { values };
      Object.assign(req.session.identityDesk, values);
      // original version, in case the new readable version does not work
      // if (!req.session) {
      //   req.session = {
      //     identityDesk: values,
      //   };
      // } else if (!req.session.identityDesk) {
      //   req.session.identityDesk = values;
      // } else {
      //   Object.assign(req.session.identityDesk, values);
      // }
    };
    next();
  });
}

/**
 * Prepare session middleware without attaching to the stack
 *
 * @param {Object} app Express app
 * @param {Object} [database] Sequelize database object. Not needed if a store is provided
 * @param {Object} [store] Store for `express-sessions`. Uses the database if a store is not provided
 * @param {Object} settings
 * @param {string} [settings.cookie='connect.sid'] Session cookie name, default set by express-session
 * @param {boolean} settings.proxy Are we behind an SSL proxy?
 * @param {Object} settings.session
 * @param {string} settings.session.secret Session secret
 */
function attachStore(app, database, store = defaultStore(database), { cookie: name, proxy, session: { secret } }) {
  app.locals.identityDesk = {
    session: session({
      name,
      proxy,
      resave: false,
      saveUninitialized: false,
      secret,
      store,
    }),
  };
}

/**
 * Create a Sequelize database session store
 *
 * @param {Object} database Sequelize database object
 * @returns {Object} Sequelize database session store
 */
function defaultStore(database) {
  const store = new(sequelizeStore(session.Store))({ db: database });
  store.sync();
  return store;
}

/**
 * Prepares session middleware and methods without attaching to the stack
 *
 * @param {Object} app Express app
 * @param {Object} [database] Sequelize database object. Not needed if a store is provided
 * @param {Object} [store] Store for `express-sessions`. Uses the database if a store is not provided
 * @param {Object} settings
 * @alias module:frameworks/express/lib/sessions.setup
 */
function setup(app, database, store, settings) {
  attachStore(app, database, store, settings);
  attachMethods(app);
}