'use-strict';
const read = require('./actions/read');

class TasksController {

  static get tasks() {
    return this.tasks;
  }

  get tasks() {
    return read(global.CONFIG.tasks.path);
  }
}
module.exports = new TasksController();
