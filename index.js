'use strict'

const WebSocket = require('ws')
const backoff   = require('./lib/fibonacci-backoff')
const pubsub    = require('ev-pubsub')


module.exports = function upsocket(options={}) {
  const { publish, subscribe, unsubscribe } = pubsub()
  const _buffer = []
  const _preamble = options.preamble
  const _buffering = (options.buffer === false) ? false : true
  const fibonacciBackoff = backoff({ initialDelay: 100, maxDelay: 8000 })

  let socket, _sending
  let _timeout = undefined
  let _shouldReconnect = true

  // close the underlying socket, and disable automatic reconnection
  // buffered data will not be sent in some cases.
  let close = function() {
    _shouldReconnect = false
    _buffer.length = 0
    if (socket && socket.readyState === socket.OPEN) {
      socket.close()
    }
  }

  let connect = function(url) {
    socket = (url instanceof WebSocket) ? url : new WebSocket(url)

    socket.onopen = function() {
      if (_preamble && (!_buffer.length || _buffer[0] !== _preamble)) {
        _buffer.unshift(_preamble)
      }

      publish('open')
      fibonacciBackoff.reset()
      _drainBuffer()
    }

    socket.onclose = function(evt) {
      publish('close')
      if (!_shouldReconnect) {
        return
      }

      // try to reconnect in ever-increasing time intervals using fibonacci sequence
      const delayTime = fibonacciBackoff.next()
      setTimeout(function() { connect(socket.url) }, delayTime)
    }

    socket.onerror = function(err) {
      // ignore connection refused messages because this module handles
      // auto-reconnects, so it's not considered an error
      if (err.code && err.code !== 'ECONNREFUSED') {
        publish('error', err)
      }
    }

    socket.onmessage = function(message) {
      publish('message', message.data)
    }
  }

  let send = function(message) {
    _buffer.push(message)
    if (_timeout === undefined) {
      _timeout = setTimeout(_drainBuffer, 0)
    }
  }

  // send the complete contents of the buffer
  let _drainBuffer = function() {
    if (!socket || socket.readyState !== socket.OPEN) {
      _clearTimeout()

      if (_buffering === false) {
        // if we're not buffering messages while disconnected, discard contents
        _buffer.length = 0
      }

      return
    }

    if(!_buffer.length) {
      _clearTimeout()
      return
    }

    if (!_sending) {
      _sending = true
      socket.send(_buffer[0])

    } else if (socket.bufferedAmount === 0) {
      // current message finished sending, send the next one
      _buffer.shift()
      _sending = false
    }

    _timeout = setTimeout(_drainBuffer, 0)
  }

  let _clearTimeout = function() {
    if (_timeout !== undefined) {
      clearTimeout(_timeout)
      _timeout = undefined
    }
  }

  return Object.freeze({ close, connect, send, publish, subscribe, unsubscribe })
}
