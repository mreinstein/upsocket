'use strict'

const nextTick    = require('next-tick')
const removeItems = require('remove-array-items')


// very simple publish/subcribe system
module.exports = function pubsub() {
  const _listeners = {}

  // TODO: implement a once(topic, handler) ?

  let publish = function(topic, ...args) {
    // execute these in the next process tick rather than synchronously. this
    // enables subscribing to topics after publishing and not missing events
    // that are published before subscribing in the same event loop
    nextTick(function() {
      if(!_listeners[topic]) return
      for(let i=0; i < _listeners[topic].length; i++) {
        _listeners[topic][i](...args)
      }
    })
  }

  let subscribe = function(topic, handler) {
    if (!_listeners[topic]) _listeners[topic] = []

    // if a function is registered for a topic more than once, likely a bug
    if(_alreadySubscribed(topic, handler)) {
      console.warn('double adding handler for topic:', topic, ' handler:', handler, 'perhaps this is a bug?')
    }

    _listeners[topic].push(handler)
  }

  let unsubscribe = function(topic, handler) {
    if (_listeners[topic]) {
      for(let i=0; i < _listeners[topic].length; i++) {
        if (_listeners[topic][i] === handler) {
          removeItems(_listeners[topic], i, 1)
          return
        }
      }
    }
  }

  let _alreadySubscribed = function(topic, handler) {
    if (!_listeners[topic]) return false

    for(let i=0; i < _listeners[topic].length; i++) {
      if (_listeners[topic][i] === handler)
      {
        return true
      }
    }

    return false
  }

  return Object.freeze({ publish, subscribe, unsubscribe })
}
