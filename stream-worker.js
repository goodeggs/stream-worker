module.exports = function(stream, concurrency, worker, cb) {

  var tasks = [],
      running = 0,
      closed = false,
      firstError = null,
      startNextTask;

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

  function startNextTask () {
    var data = tasks.shift();
    if (data == null) {
      return completeIfDone();
    }

    function finishTask (err) {
      running -= 1;
      errorHandler(err);
      if (!tasks.length) {
        stream.resume();
      }
      startNextTask();
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

  stream.on('error', function(err) {
    errorHandler(err);
  });

  stream.on('end', function() {
    closed = true;
    completeIfDone();
  });
}