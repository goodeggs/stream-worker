var Promise = require('bluebird');


/**
 *
 * @param {Stream} stream
 * @param {Function} worker - work to be done on each data element of the stream
 * @param {Object} options
 * @param {Boolean} [options.promises=false] - if true, the worker operates using promises.
 * @param {Number} [options.concurrency=10] - the maximum number of tasks to run concurrently
 * @param {Function} [done] - if using callbacks, this is called when work on the stream finishes
 */
module.exports = function(stream, worker, options, done) {
  var tasks = [],
      running = 0,
      closed = false,
      firstError = null;

  var promises = options.promises ? options.promises : false;
  var concurrency = options.concurrency ? options.concurrency : 10;
  if (promises === false) {
    worker = Promise.promisify(worker);
  }

  return Promise.try(function() {

    var resolve, reject;
    var streamPromise = new Promise(function(__resolve, __reject) {
      resolve = __resolve;
      reject = __reject;
    });

    function errorHandler (err) {
      if (err != null) {
        if (firstError == null) {
          firstError = err;
        }
      }
    }

    function closeHandler () {
      closed = true;
      completeIfDone();
    }

    function finishTask (err) {
      running -= 1;
      errorHandler(err);
      if (tasks.length) {
        startNextTask();
      } else {
        completeIfDone();
        stream.resume();
      }
    }

    function startNextTask () {
      var data = tasks.shift();
      if (data == null) {
        completeIfDone();
      }
      running += 1;
      Promise.try(function() { return worker(data); })
      .then(function (finishedWith) {
        finishTask();
        return null;
      }, function (err) {
        finishTask(err);
        return null;
      });
    }

    function completeIfDone () {
      if (!closed || tasks.length > 0 || running > 0) return;
      if (firstError) return reject(firstError);
      return resolve();
    }

    stream.on('data', function(data) {
      tasks.push(data);
      if (running < concurrency) {
        startNextTask();
      } else {
        stream.pause();
      }
    });

    stream.on('error', errorHandler);
    stream.on('close', closeHandler);
    stream.on('end', closeHandler);

    return streamPromise;
  })
  .asCallback(done);
};
