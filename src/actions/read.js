'use-strict';
const {readFile, readFileSync} = require('fs');

const tryJSON = value => {
  if (!value) {
    return
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn(err);
  }
  return value.toString();
};

  /**
   * @arg {string} path The path for the file to read
   * @arg {boolean} sync Wether or not to run synchronous, defaults to true when undefined
   * @return {object},{string} returns an object by default, returns an string when there is an error parsing
   */
const read = (path, sync) => {
  if (sync || sync === undefined) {
    try {
      return tryJSON(readFileSync(path));
    } catch (err) {
      console.warn(err);
    };
  }
  readFile(path, (err, result) => {
    if (err) {
      console.warn(err);
    }
    return tryJSON(result);
  });
};

/**
 * @mixin
 * @alias actions/read
 */
module.exports = read;
