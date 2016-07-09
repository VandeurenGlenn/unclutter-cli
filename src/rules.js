'use-strict';
const fs = require('fs');
const del = require('del');
const EventEmitter = require('events');
// require & setup compressing modules
const zlib = require('zlib');

class FolderController extends EventEmitter {
  _errorHandler(err, func) {
    console.log(`${func}::${err}`);
  }

  _updateLog(value) {
    fs.appendFileSync('log.json', JSON.stringify(value, null, 2));
  }

  _removeExtension(str) {
    var pIndex;
    while (str.lastIndexOf('.') > 0) {
      pIndex = str.lastIndexOf('.');
      // check if character before extension
      var ch = str.slice(pIndex - 1, pIndex);
      if (ch.match(/\D/)) {
        str = str.slice(0, pIndex);
      } else {
        return str;
      }
    }
    return str;
  }

  _getFileNameFromPath(str, opt) {
    str = str.replace(/(.*)\\/g, '');
    if (opt && opt['remove-extension']) {
      str = this._removeExtension(str);
    }
    return str;
  }

  ensuredir(_dir, _opt) {
    return new Promise((resolve, reject) => {
      var dir = _dir;
      var opt = _opt;
      fs.readdir(dir, err => {
        if (err) {
          this._errorHandler(err, 'ensuredir');
          fs.mkdir(dir, err => {
            if (err) {
              reject(err);
            }
            resolve(opt);
          });
        } else {
          resolve(opt);
        }
      });
    });
  }
}
class RulesHelper extends FolderController {

  _runRule(_task, path, _rule, cb) {
    var _path = path;
    var task = _task;
    var rule = _rule;
    var folderPath = task.folder.path;
    var foldername = task.folder.name;
    var archive = task.options.archive;
    this.ensuredir(task.do.path, {
      taskName: task.name,
      ruleName: task._ruleName,
      do: task.do,
      path: _path,
      rule: rule,
      folderPath: folderPath,
      foldername: foldername,
      archive: archive
    }).then(opt => {
      if (opt.path.includes(`.${opt.rule.input}`)) {
        opt.filename = this._getFileNameFromPath(opt.path);
        if (opt.do.name && opt.do.name === 'move' ||
            opt.do.name && opt.do.name === 'copy') {
          var newPath = opt.path.replace(opt.folderPath, '');
          opt.destination = opt.do.path + newPath;
          var filename = this._removeExtension(opt.filename);

          this._promiseCopy(opt).then(opt => {
            this._updateLog({
              task: {name: opt.foldername, file: filename},
              executed: `move ${filename} from ${opt.path} to ${opt.destination}`
            });
          }).catch(err => {
            this.emit('done', opt);
            cb({log: 'monitor: moved ' + filename + 'from' + opt.path + 'to' + opt.destination, opt: opt});
            this._errorHandler(err.message, err.func);
          });
          this.emit('done', opt);
          cb({log: 'monitor: moved ' + filename + 'from' + opt.path + 'to' + opt.destination, opt: opt});
        }
      } else {
        cb({log: 'monitor: finished scanning ' + opt.path, opt: opt});
      }
    });
  }

  _run(_task, path, cb) {
    var calls = 0;
    var rules = _task.rules;
    rules.forEach((rule, index) => {
      calls += 1;
      if (rule.by === 'extension') {
        // ensure a name is provided!
        _task._ruleName = rule.input || index;
        this._runRule(_task, path, rule, cb);
      }
    });
  }

  _promiseCopy(opt) {
    return new Promise((resolve, reject) => {
      const gzip = zlib.createGzip();
      // create Gunzip for unzipping
      const gunzip = zlib.createGunzip();
      const _in = fs.createReadStream(opt.path, {
        flags: 'r',
        encoding: null,
        fd: null,
        mode: 0o666,
        autoClose: true
      });
      // create write stream <NEW_PATH>.gz
      const _out = fs.createWriteStream(`${opt.destination}.gz`, {
        flags: 'w',
        defaultEncoding: null,
        fd: null,
        mode: 0o666,
        autoClose: true
      });
      _in.pipe(gzip)
        .pipe(_out)
        .on('finish', () => {
          console.log('done compressing');
          this._updateLog({
            task: {name: opt.foldername, file: opt.filename.replace(`.${opt.rule.input}`, '')},
            zipped: `${opt.filename} to ${opt.destination}.gz`
          });
          if (opt.archive) {
            // keep file zipped when archive is set to true
            this._promiseRemove(opt.path).then(() => {
              resolve(opt);
            });
          } else {
            // unzip the file
            var zippedIn = fs.createReadStream(`${opt.destination}.gz`);
            var zippedOut = fs.createWriteStream(opt.destination);

            zippedIn
            .pipe(gunzip)
            .pipe(zippedOut)
            .on('finish', () => {
              console.log('done un-compressing');
              this._updateLog({
                task: {name: opt.foldername, file: opt.filename.replace(`.${opt.rule.input}`, '')},
                unzipped: `${opt.filename}.gz to ${opt.destination}`
              });

              if (opt.do.name === 'move') {
                var glob = [opt.path, `${opt.destination}.gz`];
                this._promiseRemove(glob).then(log => {
                  console.log(log);
                  resolve(opt);
                });
              }
            }).on('error', err => {
              err = {
                message: err,
                func: '_promiseCopy'
              };
              reject(err);
            });
          }
        }).on('error', err => {
          err = {
            message: err,
            func: '_promiseCopy'
          };
          reject(err);
        });
    });
  }

  _promiseRemove(path) {
    // add dryRun
    return new Promise(function(resolve) {
      del(path, {force: true}).then(paths => {
        var log = paths;
        if (paths.length > 1) {
          log = paths.join('\n');
        }
        resolve(`Deleted files and folders:
        ${log}`);
      });
    });
  }

}
class Rules extends RulesHelper {

  constructor() {
    super();
    this.jobs = [];
    this.on('done', result => {
      this.jobs.splice(0, 1);
      if (this.jobs.length) {
        this._run(this.jobs[0]);
      }
      console.log(result);
    });
  }

  addJob(o, cb) {
    this.jobs.push(o);
  }

  clearTimeout() {
    clearTimeout(this.timeout());
  }

  timeout(cb) {
    setTimeout(() => {
      cb();
    }, 15000);
  }

  run(o, cb) {
    this.timeout(() => {
      var task = o.task;
      var path = o.path;
      // const timer = require('./timer');
      // timer.start();
      if (fs.lstatSync(path).isFile()) {
        this._run(task, path, cb);
      } else {
        fs.readdir(path, function(err, results) {
          if (err) {
            this._errorHandler(err, '_initWatcher');
            cb(err);
          } else if (results.inlude('.')) {
            this._run(task, path, cb);
          } else if (results.length) {
            results.forEach(result => {
              if (result.includes('.')) {
                this._run(task, path, cb);
              }
            });
          }
        });
      }
    });
  }
}

module.exports = new Rules();
