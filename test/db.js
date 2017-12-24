'use strict';

/**
 * Module dependencies.
 */

const assert = require('assert');
const proxyquire = require('proxyquire').noCallThru();

const db = proxyquire('../lib/db', { sequelize: Sequelize });

/**
 * Sequelize mock
 *
 * @param {Object} options
 */
function Sequelize(options) {
  this.options = options;
  this.mock = true;
}

Sequelize.STRING = 'DUMMY VALUE';

Sequelize.prototype.authenticate = function() {
  this.authenticateCalled = true;
};

Sequelize.prototype.define = function(name, attributes, options) {
  this.models = this.models || {};
  this.models[name] = {};
  this.defineCalled = true;
  return {};
};

Sequelize.prototype.sync = function() {
  this.syncCalled = true;
};

const models = {
  person: {
    associate: container => {
      models.person.associateCalled = true;
    },
    attributes: DataTypes => {
      if (DataTypes === Sequelize) {
        models.person.sequelizePassed = true;
        return {
          name: DataTypes.STRING,
        };
      }
    },
    define: () => {
      models.person.defineCalled = true;
    },
    options: {
      table: 'not_first',
    },
  },
};

/**
 * Test suite
 */

describe('db', () => {
  const options = { dialect: 'sqlite' };
  let connection;

  describe('create', () => {
    it('should work', () => {
      connection = db.create(options);
      assert(connection.options === options);
      assert((connection.mock = true));
    });
  });

  describe('init', () => {
    it('should work', async () => {
      await db.init(connection);
      assert(connection.authenticateCalled);
      assert(connection.syncCalled);
    });
  });

  describe('defineModel', () => {
    it('should call connection.define', () => {
      db.defineModel('', {}, connection);
      assert(connection.defineCalled);
    });

    it('should return a model container object', () => {
      const container = db.defineModel('myModel', {}, connection);
      assert(container.MyModel);
    });

    it('should pass the Sequelize class to the model attributes function', () => {
      db.defineModel('', models.person, connection);
      assert(models.person.sequelizePassed);
    });
  });

  describe('load', () => {
    models.person.defineCalled = false;
    let container;

    it('should call connection.define', () => {
      const connection = db.create(options);
      container = db.load(models, connection);
      assert(connection.defineCalled);
    });

    it('should have a Person model', () => {
      assert(container.Person);
    });

    it("should call the model's define method", () => {
      assert(models.person.defineCalled);
    });

    it("should call the model's associate method", () => {
      assert(models.person.associateCalled);
    });
  });
});
