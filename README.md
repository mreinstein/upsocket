# upsocket

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

This is a simplistic websocket server, listening for connections and responding to all 
incoming messages with the current server time.


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

We can see that the first 5 seconds worth of requests are buffered and all come through at `13:48:12`.

The requests then come in one per second once the connection has been established.


If we kill the server and bring it back again while the client is running we can observe a similar 
discontinuity as all the pending requests come through at `14:09:00`:

```bash
$ node client.js 
time = Sat Feb 18 2017 14:08:50 GMT-0800 (PST)
time = Sat Feb 18 2017 14:08:51 GMT-0800 (PST)
time = Sat Feb 18 2017 14:09:00 GMT-0800 (PST)
time = Sat Feb 18 2017 14:09:00 GMT-0800 (PST)
time = Sat Feb 18 2017 14:09:00 GMT-0800 (PST)
time = Sat Feb 18 2017 14:09:00 GMT-0800 (PST)
time = Sat Feb 18 2017 14:09:00 GMT-0800 (PST)
time = Sat Feb 18 2017 14:09:00 GMT-0800 (PST)
time = Sat Feb 18 2017 14:09:00 GMT-0800 (PST)
time = Sat Feb 18 2017 14:09:00 GMT-0800 (PST)
time = Sat Feb 18 2017 14:09:00 GMT-0800 (PST)
time = Sat Feb 18 2017 14:09:01 GMT-0800 (PST)
time = Sat Feb 18 2017 14:09:02 GMT-0800 (PST)
```

## methods

### var up = upsocket()

Create an upsocket object `up`.


### up.connect(url)

Establish a connection to a websocker server running at `url`.


### up.send(message)

Send a `message` over the connection. If the connection is down, `message` gets buffered
until the connection is established, at which time it will send all buffered messages until
fully drained.


### up.close()

Close the websocket connection and don't attempt to reconnect.


### subscribe(topic, handler)

subscribe to an event that the upsocket connection fires.

```javascript

up = upsocket()

up.subscribe('open', function() {
  // connection opened
})

up.subscribe('close', function() {
  // connection closed
})

up.subscribe('message', function(data) {
  
})

up.subscribe('error', function(err) {
 
})
```


### unsubscribe(topic, handler)

remove an event subscription handler. Useful if your code cares about cleaning up properly.

```
up = upsocket()

function messageReceived(data) {
  // do some sutff with the message
}

up.subscribe('message', messageReceived)

// some stuff happens here in your application logic...

// some time later, we want to cleanup, and remove the handler:
up.unsubscribe('message', messageReceived)
```


## license

MIT
