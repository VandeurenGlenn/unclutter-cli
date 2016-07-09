'use-strict';
const fs = require('fs');

class Monitor {
  constructor() {
    this.taskList = [];
  }

  run(tasks) {
    return new Promise(function(resolve, reject) {
      if (!tasks) {
        try {
          tasks = this.tasks;
        } catch (err) {
          return reject(err);
        }
      }
      if (tasks.length) {
        var watchers = [];
        for (var i = 0; i < tasks.length; i++) {
          if (tasks[i].options.enabled) {
            var data = {
              watcher: watchers[i],
              task: tasks[i]
            };
            resolve(data);
          }
        }
      }
    });
  }

  _updateLog(value) {
    fs.appendFileSync('log.json', JSON.stringify(value, null, 2));
  }

  _errorHandler(err, func) {
    console.log(`${func}::${err}`);
  }
}

module.exports = new Monitor();
