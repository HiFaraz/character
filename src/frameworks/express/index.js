'use strict';

module.exports = function(CoreFramework) {
  return class Express extends CoreFramework {

    get app() {
      return this.expressify();
    }

  };
};