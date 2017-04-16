'use strict'

const backoff = require('../lib/fibonacci-backoff')
const test    = require('tap').test


test('backoff delays should follow a Fibonacci sequence', function(t) {
  const b = backoff({ initialDelay: 10, maxDelay: 1000 })

  // Fibonacci sequence: x[i] = x[i-1] + x[i-2].
  const expectedDelays = [ 10, 10, 20, 30, 50, 80, 130, 210, 340, 550, 890, 1000 ]
  const actualDelays = []

  for (var i = 0; i < expectedDelays.length; i++) {
      actualDelays.push(b.next())
  }

  t.deepEqual(expectedDelays, actualDelays, 'Generated delays should follow a Fibonacci sequence.')

  t.end()
})


test('backoff delays should restart from the initial delay after reset', function(t) {
  const b = backoff({ initialDelay: 10, maxDelay: 1000 })

  b.next()
  b.reset()

  const backoffDelay = b.next()
  t.equals(backoffDelay, 10, 'Strategy should return the initial delay after reset.')

  t.end()
})
