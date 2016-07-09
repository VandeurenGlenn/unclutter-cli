const {mkdirSync, statSync, writeFileSync} = require('fs');
const ProgressBar = require('progress');
let homedir = require('os').homedir();

const createDir = () => {
  try {
    statSync(`${homedir}/.UnClutter`);
  } catch (err) {
    mkdirSync(`${homedir}/.UnClutter`);
  }
};

const createConfig = () => {
  try {
    statSync(`${homedir}/.UnClutter/cli-config.json`);
  } catch (err) {
    writeFileSync(`${homedir}/.UnClutter/cli-config.json`, JSON.stringify({
      tasks: {
        path: `${homedir}/.UnClutter/tasks.json`
      }
    }, null, 2));
  }
};

const createTasks = () => {
  try {
    statSync(`${homedir}/.UnClutter/tasks.json`);
  } catch (err) {
    writeFileSync(`${homedir}/.UnClutter/tasks.json`, JSON.stringify([
      {
        name: 'Demo Task',
        options: {
          enabled: true,
          archive: false,
          folderDepth: 99
        },
        match: 'all',
        rules: [
          {
            by: 'extension',
            if: 'is',
            input: 'exe'
          }, {
            by: 'extension',
            if: 'is',
            input: 'msi'
          }
        ],
        do: {
          name: 'log',
          path: `${homedir}/.UnClutter/log.json`
        },
        folder: {
          name: 'Downloads',
          path: 'C:\\Users\\..\\Downloads',
          webkitRelativePath: '..\\Downloads',
          size: 655360
        },
        running: false
      }
    ], null, 2));
  }
};

let bar = new ProgressBar('Creating folders & files [:bar] :percent :etas', {
  width: 20,
  total: 3
});
createDir();
bar.tick();
createConfig();
bar.tick();
createTasks();
bar.tick();
