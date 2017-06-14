'use strict';

module.exports = function(CoreFramework) {
  return class Express extends CoreFramework {
    app() {
      return this.expressify();
    }
  };
};