'use strict'


module.exports = function fibonacciBackoff(options={}) {
  let backoffDelay, nextBackoffDelay
  const initialDelay = options.initialDelay || 100
  const maxDelay = options.maxDelay || 10000
  const randomisationFactor = options.randomisationFactor || 0

  let next = function() {
    const nextDelay = Math.min(nextBackoffDelay, maxDelay)

    nextBackoffDelay += backoffDelay

    backoffDelay = nextDelay

    const randomisationMultiple = 1 + Math.random() * randomisationFactor
    const randomizedDelay = Math.round(backoffDelay * randomisationMultiple)

    return randomizedDelay
  }

  let reset = function() {
    backoffDelay = 0
    nextBackoffDelay = initialDelay
  }

  reset()

  return Object.freeze({ next, reset })
}
