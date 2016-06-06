stream-worker  [![build status](https://secure.travis-ci.org/goodeggs/stream-worker.png)](http://travis-ci.org/goodeggs/stream-worker)
=============

Execute an async function per [stream](http://nodejs.org/api/stream.html) data event, pausing the stream when a concurrency limit is saturated.  Inspired by [async.queue](https://github.com/caolan/async#queue), optimized for streams.

Supports promises and callbacks.


The Basics
----------

```
npm install stream-worker
```

Requiring:

```js
var streamWorker = require('stream-worker');
```


Promise style:
```js
function doWork(data){
  /* ... do some work with data ... */
  return Promise.resolve();
}
streamWorker(stream, doWork, {promises : true, concurrency : 10})
.then(function() {
  /* ... the stream is exhausted and all workers are finished ... */
}, function(err) {
  /* ... there was an error processing the stream ... */
})
```


Callback style:

```js

function doWork(data, done){
  /* ... do some work with data ... */
  return done(err);;
}
streamWorker(stream, doWork, {promises : false, concurrency :10},
  function(err) {
    /* ... the stream is exhauseted and all workers are finished ... */
  }
);
```

Signature
---------
streamWorker(**stream**, **work**, **options**, **done**)

Where **options** is an object with 2 optional parameters:

| Parameter     | Default       | Description|
|------------- |-------------| -----|
| promises      |false| true if you want to use the above promises style|
| concurrency| 10|specifies how many concurrent workers you want doing work in the stream |

And **done** is a callback function if you use the callback workflow.


