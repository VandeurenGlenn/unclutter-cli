global.CONFIG = require('./config')();
const program = require('commander');
const tasksController = require('./tasks.js');
const monitor = require('./monitor.js');
const watcher = require('./watcher.js');
const rules = require('./rules.js');
const indexer = require('./indexer');

// Setup tasks so it can be used global
let tasks;
let jobs = [];
var jobCalls = 0;

program
.arguments('<arg>')
.option('-t, --tasks <tasks>',
  `The task to run,
  checkout [task-config](${global.CONFIG.docsPath}#task-config) for more info`)
.action(function(arg) {
  switch (arg) {
    // case 'watch':
    // case 'w':
    //   if (program.task) {
    //     watcher.start({task: program.task});
    //   } else {
    //     watcher.start(data);
    //   }
    //   break;
    case 'run':
    case 'r':
      if (program.tasks && typeof program.tasks === 'object') {
        tasks = program.tasks;
      } else {
        tasks = tasksController.tasks;
      }
      monitor.run(tasks).then(data => {
        if (data.task.options.enabled) {
          watcher.start(data, result => {
            jobs.push(result);
            jobCalls += 1;
            if (!indexer.contains('index', result.path)) {
              indexer.add(result.path);
            }
            if (!indexer.contains('processed', result.path)) {
              rules.run(result, result => {
                // The processed file will be used to ignore the paths on option
                indexer.add({target: 'processed', item: result.opt.path});
                if (jobs.length === jobCalls) {
                  process.exit(0);
                }
              });
            }
          });
        }
      });
      break;
    default:

  }
  // console.log('arg: %s', arg, program.tasks);
})
.parse(process.argv);
