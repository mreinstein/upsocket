'use strict'

const WebSocket = require('ws')


const SOCKET_OPEN = 1

module.exports = function upsocket() {
  const _buffered = []
  const _listeners = {}

  let socket

  let close = function() {
    if (socket && socket.readyState === SOCKET_OPEN) {
      socket.close()
      _publish('close')
    }
  }

  let connect = function(url) {
    socket = new WebSocket(url)

    socket.onopen = function() {
      _publish('open')
      _drainBuffer()
    }

    socket.onclose = function() {
      console.log('connection lost')
      _publish('close')
      // try to reconnect in 5 seconds
      setTimeout(function(){ _start(url) }, 5000)
    }

    socket.onerror = function(err) {
      console.log('encountered an error', err)
      _publish('error', err)
    }

    socket.onmessage = function(message) {
      _publish('message', message)
    }
  }

  let send = function(message) {
    if (!socket || socket.readyState !== SOCKET_OPEN) {
      return _buffered.push(message)
    }

    socket.send(message, function(err) {
      if (err) {
        console.log('error sending message:', err)
        _buffered.push(message)
      }
    })
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

  // send the complete contents of the buffer
  let _drainBuffer = function() {
    const toSend = _buffered[0]
    if (!toSend) return

    socket.send(toSend, function(err) {
      // the 
      if(err) {
        return
      }
      _buffered.shift()  // message sent ok, pull it off the queue
      _drainBuffer()
    })
  }

  let _publish = function(topic, ...args) {
    if(!_listeners[topic]) return

    for(let i=0; i < _listeners[topic].length; i++) {
      _listeners[topic][i](...args)
    }
  }

  return Object.freeze({ close, connect, send, subscribe, unsubscribe })
}
