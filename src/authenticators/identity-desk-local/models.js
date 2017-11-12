'use strict';

/**
 * Module dependencies.
 */
import { INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from 'http-codes';
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
        const result = {};

        try {
          const user = await User.findOne({
            attributes: ['id', 'password'],
            where: { username },
          });
          if (user) {
            result.id = user.id;
            result.status = (await compareHash(password, user.password))
              ? OK
              : UNAUTHORIZED;
          } else {
            result.status = NOT_FOUND;
          }
        } catch (error) {
          result.error = error;
          result.status = INTERNAL_SERVER_ERROR;
        }

        return result;
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
        const result = {};

        try {
          // Object.getPrototypeOf(User).create.call(User, ...) calls the original User.create method
          const created = await Object.getPrototypeOf(User).create.call(
            User,
            Object.assign({}, user, {
              password: await generateHash(user.password, saltRounds),
            }),
          );
          result.id = created.id;
          result.status = OK;
        } catch (error) {
          if (error instanceof Sequelize.UniqueConstraintError) {
            throw new Error('Username already exists');
          } else {
            throw error;
          }
        }

        return result;
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
