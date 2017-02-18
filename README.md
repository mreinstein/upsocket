## upsocket

Keep a websocket connection alive and re-establish state between reconnects with a transactional message queue.

Works in both node and the browser.


## example

server.js:
```javascript
var ws = require('ws')

var server = new ws.Server({ port: 7000 })

server.on('connection', function(client) {
  client.on('message', function(message) {
    client.send(new Date().toString())
  })
})

```

Now when you want to make a call to the server, guard your connection in the up() function.
If the connection is alive the callback fires immediately. If the connection is down the message
is buffered and sends when the connection is ready again.


client.js:
```javascript
var upsocket = require('upsocket')

var up = upsocket()

up.subscribe('message', function(data) {
  console.log('time = ' + data)
})

up.connect('ws://localhost:7000')

setInterval(function () {
  up.send('GET-TIME')
}, 1000)

```

If we fire the client up first, then wait a few seconds to fire up the server:

```bash
$ node client.js & sleep 5; node server.js
[1] 9165
time = Sat Feb 18 2017 13:48:12 GMT-0800 (PST)
time = Sat Feb 18 2017 13:48:12 GMT-0800 (PST)
time = Sat Feb 18 2017 13:48:12 GMT-0800 (PST)
time = Sat Feb 18 2017 13:48:12 GMT-0800 (PST)
time = Sat Feb 18 2017 13:48:12 GMT-0800 (PST)
time = Sat Feb 18 2017 13:48:13 GMT-0800 (PST)
time = Sat Feb 18 2017 13:48:14 GMT-0800 (PST)
time = Sat Feb 18 2017 13:48:15 GMT-0800 (PST)
time = Sat Feb 18 2017 13:48:16 GMT-0800 (PST)
```

We can see that the first 5 seconds worth of requests are buffered and all come through at 13:48:12.

The requests then come in one per second once the connection has been established.

## methods

TODO

## license

MIT
