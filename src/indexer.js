'use-strict'; // require everything to be defined
// create/require methods/modules to use
const config = require('./config')();
const read = require('./actions/read');
const write = require('./actions/write');
const {timeout} = require('./utils');
// notice the {brackets} around timeout,
// this is the awesomness of es6 in the work,
// now we only import the method we need, less is more !

// Create the 'indexer' class for indexing scanned paths & processed files
class Indexer { // so, this is a class... !
  // I call it Indexer :D

  get index() {
    if (!this._index) {
      this._index = this.getIndexFor('index') || [];
    }
    return this._index;
  }

  get processed() {
    if (!this._processed) {
      this._processed = this.getIndexFor('processed') || [];
    }
    return this._processed;
  }

  set noPromise(value) {
    this._noPromise = value;
  }

  get noPromise() {
    // never ever call the same property (example: 'this.noPromise' will not work, this will create a loop ...)
    return this._noPromise || false;
  }

  /**
   * Returns the index for 'index.json' & 'processed.json'
   * @arg {string} filename The filename for the file to read
   * @return {array} Returns the data for given filename
   */
  getIndexFor(filename) {
    // try to read & parse json file
    try {
      return read(`${config.homeDirectory}/${filename}.json`);
    } catch (err) {
        // Should be logged properly (for now we leave it like this)
        // return the index when already existing else return a empty array
      return this[filename] || [];
    }
  }

  /**
   * @arg {string} target An string referencing to the array to check
   * @arg {object} item The item to check for existance
   * @return {promise} resolves a boolean
   */
  contains(target, item) {
    return Boolean(this[target].indexOf(item) > -1);
  }

  /**
   * @arg {string} target The target to update ('index' or 'processed')
   * @return {method} timeout when already writing, else it writes the file to <target>.json
   */
  updateIndexFor(target) {
    if (this.writing) {
      return timeout(this.updateIndexFor(target));
    }
    this.writing = true;
    write(`${config.homeDirectory}/${target}.json`, this[target]);
    this.writing = false;
    return;
  }

  /**
   * Add a new item to the 'index' array
   * @arg {object} opt An object containing an target & item, when no target set, 'index' will be the target
   */
  add(opt) {
    if (!opt.target) {
      opt = {
        item: opt,
        target: 'index'
      };
    }
    this[opt.target].push(opt.item);
    this.updateIndexFor(opt.target);
  }

  /**
   * Add a new item to the 'index' array
   * @arg {object} opt An object containing an target & item, when no target set, 'index' will be the target
   */
  remove(opt) {
    if (!opt.target) {
      opt = {
        item: opt,
        target: 'index'
      };
    }
    // hmm, for gc I think delete was not the best option?
    delete this[opt.target[opt.item]];
    this.updateIndexFor(opt.target);
  }
}
// when the module is imported(required) we create a new instance...
// I know this isn't the best way for writing modules, butt in this case this is the best solution.
// Feel free to create a 'PR' with your sugestions
module.exports = new Indexer();
