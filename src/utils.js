'use-strict';

class Utils {
  timeout(cb) {
    // use arrow function (() => {}) for binding to (this)
    return setTimeout(() => {
      cb();
    }, 1000);
  }
}

module.exports = new Utils();
