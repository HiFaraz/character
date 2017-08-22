'use strict';

export default {
  user: {
    attributes: DataTypes => ({
      password: DataTypes.STRING,
      username: DataTypes.STRING,
    }),
  },
};
