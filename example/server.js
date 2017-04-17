var ws = require('ws')
 
var server = new ws.Server({ port: 7000 })
 
server.on('connection', function(client) {
  let firstMessage

  client.on('message', function(message) {
    if (!firstMessage) {
      firstMessage = message
      console.log('received first message:', message)
      return
    }
    client.send(new Date().toString())
  })
})
