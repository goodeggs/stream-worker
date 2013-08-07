stream-worker
=============

Execute an async function per stream data event, pausing the stream when a concurrency limit is saturated

[![build status](https://secure.travis-ci.org/goodeggs/stream-worker.png)](http://travis-ci.org/goodeggs/stream-worker)

The Basics
----------

```
npm install stream-worker
```

then

```
var streamWorker = require('stream-worker');

streamWorker(stream, 10, function(data, done){ /*...*/ }, function(err) { /*...*/ ));
```

Signature
---------
streamWorker(**stream**, **concurrencyLimit**, **work**, **done**)