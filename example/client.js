'use strict'

const upsocket = require('../')


const up = upsocket({ preamble: JSON.stringify({ userID: 4 }) })

up.connect('ws://localhost:7000')

up.subscribe('message', function(message) {
  console.log('TIME =', message)
})

setInterval(function () {
  up.send('GET-TIME')
}, 1000)
