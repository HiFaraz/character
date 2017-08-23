'use strict';

/**
 * Module dependencies.
 */
import { NOT_FOUND, OK, UNAUTHORIZED } from 'http-codes';
import { compare as compareHash, hash as generateHash } from 'bcryptjs';
import Sequelize from 'sequelize';

const saltRounds = 12; // TODO read this from config, don't hardcode this

export default {
  user: {
    attributes: DataTypes => ({
      password: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      username: {
        allowNull: false,
        type: Sequelize.STRING,
      },
    }),
    define: User => {
      /**
       * Authenticate a username and password
       * 
       * @param {string} username
       * @param {string} password
       * @return {Promise<Object>}
       */
      User.authenticate = async (username, password) => {
        try {
          const user = await User.findOne({
            attributes: ['id', 'password'],
            where: { username },
          });
          const result = {};
          if (user) {
            result.id = user.id;
            result.status = (await compareHash(password, user.password))
              ? OK
              : UNAUTHORIZED;
          } else {
            result.status = NOT_FOUND;
          }
          return result;
        } catch (error) {
          return new Error(error);
        }
      };

      /**
       * Hash passwords when creating a new user
       * 
       * @param {Object} user
       * @param {string} user.username
       * @param {string} user.password
       * @return {Promise<Object>} Sequelize model instance
       */
      User.create = async user => {
        // Object.getPrototypeOf(User).create.call(User, ...) calls the original User.create method
        return Object.getPrototypeOf(User).create.call(
          User,
          Object.assign({}, user, {
            password: await generateHash(user.password, saltRounds),
          }),
        );
      };

      // TODO need a class method to change a user's password
    },
    options: {
      indexes: [
        {
          fields: ['username'],
          unique: true,
        },
      ],
    },
  },
};
