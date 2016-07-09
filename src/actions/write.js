'use-strict';
const {writeFile, writeFileSync} = require('fs');

const tryJSON = value => {
  try {
    return JSON.stringify(value, null, 2);
  } catch (err) {
    console.warn(err);
  }
  return value.toString();
};

/**
 * @arg {string} path The path for the file to write
 * @arg {object} data The data to write to the file
 * @arg {boolean} sync Wether or not to run synchronous, defaults to true when undefined
 * @return {object},{string} returns an object by default, returns an string when there is an error parsing
 */
const write = (path, data, sync) => {
  if (sync || sync === undefined) {
    try {
      return writeFileSync(path, tryJSON(data));
    } catch (err) {
      return console.warn(err);
    }
  }
  writeFile(path, tryJSON(data), (err, result) => {
    if (err) {
      return console.warn(err);
    }
    return result;
  });
};

/**
 * @mixin
 * @alias actions/write
 */
module.exports = write;
