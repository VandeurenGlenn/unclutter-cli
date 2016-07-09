'use-strict';
// require readFileSync only
const read = require('./actions/read');
const write = require('./actions/write');
const os = require('os');
const homeDirectory = os.homedir();
let _package;
let cliConfig;

const setup = config => {
  config.version = _package.version;
  config.docsPath = _package.homepage.replace('#readme', '/docs');
  config.homeDirectory = `${homeDirectory}/.Unclutter`;
  if (config.tasks) {
    config.tasks.path = config.tasks.path || `${config.homeDirectory}/tasks.json`;
  }
  return config;
};

const defaultConfig = {
  tasks: {
    path: `${homeDirectory}\\.UnClutter\\tasks.json`
  }
};

/**
 * @constructor
 */
const config = () => {
  _package = read('package.json');
  cliConfig = read(`${homeDirectory}\\.UnClutter\\cli-config.json`);
  if (cliConfig !== undefined) {
    return setup(cliConfig);
  }
  write(`${homeDirectory}\\.UnClutter\\cli-config.json`, defaultConfig);
  return setup(defaultConfig);
};
module.exports = config;
