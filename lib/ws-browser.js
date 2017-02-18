'use strict'

// replace the ws module with the Browser's WebSocket implementation
// when in the browser environment
module.exports = global.WebSocket
