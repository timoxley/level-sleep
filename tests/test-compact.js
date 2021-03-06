var lsleep = require('../')
  , noop = function () {}
  , cleanup = require('cleanup')
  , rimraf = require('rimraf')
  , ok = require('okdone')
  , assert = require('assert')
  , bytewise = require('bytewise')
  ;

var d = cleanup(function (error) {
  rimraf.sync(__dirname+'/testdb')
  if (error) process.exit(1)
  ok.done()
})

var s = lsleep(__dirname+'/testdb')
s.get('test-compact', function (e, db) {

  function assertSequences (num, cb) {
    var entries = db.mutex.lev.createReadStream({})
      , len = 0
      ;

    entries.on('data', function (entry) { len += 1 })
    entries.on('end', function () {
      assert.equal(len, num)
      ok('seqs '+num)
      cb(null)
    })
  }

  db.put('id1', 1, noop)
  db.put('id2', 2, noop)
  db.put('id2', 2, noop)
  db.put('id2', 2, noop)
  db.put('id2', 2, noop)
  db.put('id2', 2, noop)
  db.put('id2', 2, noop)
  db.put('id2', 2, noop)
  db.put('id1', 3, function () {
    db.get('id1', function (e, data) {
      assert.equal(data, 3)
      ok('overwrite')

      assertSequences(18, function () {
        db.compact(function () {
          assertSequences(4, function () {
            d.cleanup()
          })
        })
      })
    })
  })
})