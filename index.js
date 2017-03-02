'use strict'

const WebSocket = require('ws')
const backoff   = require('./lib/fibonacci-backoff')
const pubsub    = require('./lib/pubsub')


module.exports = function upsocket(options={}) {
  const { publish, subscribe, unsubscribe } = pubsub()
  const _buffer = []
  const _preamble = options.preamble
  const _buffering = (options.buffer === false) ? false : true
  const fibonacciBackoff = backoff({ initialDelay: 100, maxDelay: 8000 })

  let socket, _sending, _timeout, _sendPreamble

  let connect = function(url) {
    socket = (url instanceof WebSocket) ? url : new WebSocket(url)

    socket.onopen = function() {
      fibonacciBackoff.reset()
      _sendPreamble = !!_preamble
      _drainBuffer()
    }

    socket.onclose = function(evt) {
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
    if (!_timeout) {
      _timeout = setTimeout(_drainBuffer, 0)
    }
  }

  // send the complete contents of the buffer
  let _drainBuffer = function() {
    if (!socket || socket.readyState !== socket.OPEN) {
      _timeout = null

      if (_buffering === false) {
        // if we're not buffering messages while disconnected, discard contents
        _buffer.length = 0
      }

      return
    }

    if(!_sendPreamble && !_buffer.length) {
      _timeout = null
      return
    }

    if (!_sending) {
      _sending = true
      socket.send(_sendPreamble ? _preamble : _buffer[0])
      _sendPreamble = false

    } else if (socket.bufferedAmount === 0) {
      // current message finished sending, send the next one
      _buffer.shift()
      _sending = false
    }
    _timeout = setTimeout(_drainBuffer, 0)
  }

  return Object.freeze({ connect, send, publish, subscribe, unsubscribe })
}
