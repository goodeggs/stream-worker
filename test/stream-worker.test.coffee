expect = require 'expect.js'
sinon = require 'sinon'
expect = require('sinon-expect').enhance(expect, sinon, 'was')
{PassThrough} = require 'stream'
streamWorker = require '..'

describe 'stream-worker', ->
  {stream, concurrencyLimit, work, workers, done} = {}
  
  beforeEach ->
    concurrencyLimit = 2
    stream = new PassThrough()
    workers = []
    done = sinon.spy()
    work = sinon.spy (data, done) ->
      workers.push {data, done}

    streamWorker stream, concurrencyLimit, work, done

  describe 'when the stream emits data', ->
    beforeEach ->
      stream.write 'a'

    it 'invokes the worker function on the data', ->
      expect(work).was.calledOnce()

  describe 'when the concurrency limit is reached and more data is emitted', ->
    beforeEach ->
      sinon.spy stream, 'pause'
      for x in [0..concurrencyLimit]
        stream.write 'b'

    it 'pauses the stream', ->
      expect(work.callCount).to.be 2
      expect(stream.pause).was.called()

    describe 'then a worker frees up', ->
      beforeEach ->
        sinon.spy stream, 'resume'
        workers[0].done() # works on the extra data that caused us to pause the stream
        workers[1].done() # free to work on something new

      it 'resumes the stream', ->
        expect(stream.resume).was.called()

  describe 'when the stream ends', ->
    describe 'while workers are working', ->
      beforeEach (done) ->
        stream.write 'a'
        stream.end(done)

      it 'waits for all workers to finish, then calls the done callback', ->
        expect(done).was.notCalled()
        worker.done() for worker in workers
        expect(done).was.called()

    describe 'before emitting any data', ->
      beforeEach (done) ->
        stream.end(done)

      it 'still calls the done callback', ->
        expect(done).was.called()
