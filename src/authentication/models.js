'use strict';

export default {
  account: {
    associate: ({ Authentication$Account, Core$Identity }) => {
      Authentication$Account.belongsTo(Core$Identity);
      Core$Identity.hasMany(Authentication$Account);
    },
    fields: DataTypes => ({
      authenticatorId: DataTypes.INTEGER,
      authenticatorName: DataTypes.STRING,
    }),
  },
};
