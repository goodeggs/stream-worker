module.exports = function(stream, concurrency, worker, cb) {

  var tasks = [],
      running = 0,
      closed = false,
      firstError = null;

  function errorHandler (err) {
    if (err != null) {
      if (firstError == null) {
        firstError = err;
      }
    }
  }

  function completeIfDone () {
    if (closed && tasks.length === 0 && running <= 0) {
      if (typeof cb === "function") {
        cb(firstError);
      }
    }
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
    try {
      worker(data, finishTask);
    } catch (e) {
      finishTask(e);
    }
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

  stream.on('end', function() {
    closed = true;
    completeIfDone();
  });
};