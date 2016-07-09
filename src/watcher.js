'use-strict';
const chokidar = require('chokidar');
class Watcher {
  start(o, cb) {
    // return new Promise((resolve, reject) => {
    var _task = o.task;
    var watcher = chokidar.watch(_task.folder.path, {
      ignored: /[\/\\]\./,
      depth: _task.options.folderDepth
    });
    watcher._task = _task;
    watcher.add(_task.folder.path);

    var task = watcher._task;
    task.running = true;
      // tasksController.updateTask(task.name, task);
    watcher.on('add', path => {
      cb({task: watcher._task, path: path});
    });
  }
}

module.exports = new Watcher();
