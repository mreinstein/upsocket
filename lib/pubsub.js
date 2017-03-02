'use strict'

// very simple publish/subcribe system
module.exports = function pubsub() {
  const _listeners = {}

  let publish = function(topic, ...args) {
    if(!_listeners[topic]) return

    for(let i=0; i < _listeners[topic].length; i++) {
      _listeners[topic][i](...args)
    }
  }

  let subscribe = function(topic, handler) {
    if (!_listeners[topic]) _listeners[topic] = []
    _listeners[topic].push(handler)
  }

  let unsubscribe = function(topic, handler) {
    if (_listeners[topic]) {
      for(let i=0; i < _listeners[topic].length; i++) {
        if (_listeners[topic][i] === handler) {
          _listeners[topic].splice(i, 1)
          return
        }
      }
    }
  }

  return Object.freeze({ publish, subscribe, unsubscribe })
}
