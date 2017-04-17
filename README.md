# upsocket

Keep a websocket connection alive and re-establish state between reconnects with a transactional message queue.

Works in both node and the browser.


## example

example/server.js:
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


example/client.js:
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
$ node example/client.js & sleep 5; node example/server.js
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

### var up = upsocket(options)

Create an upsocket object `up`.

`options` is an optional object with configuration parameters:

#### `preamble`
a message to send whenever the server connection is established. This can be used to send
  authentication details in the first message sent to the websocket server. e.g.,

```javascript
const up = upsocket({ preamble: JSON.stringify({ userID: 4, questionID: 12 }) })

up.connect('ws://localhost:7000')
```

every time the client connects, this message will be the first one sent to the server.

#### `buffer`
(boolean) if set to `false`, messages will not be buffered while the connection is down.
defaults to `true`.

```javascript
const up = upsocket({ buffer: false }) })

up.connect('ws://localhost:7000')
```


### up.connect(url)

Connect to a websocker server.

`url` may be a connection string, or an existing `WebSocket` instance.

```javascript

var url = 'ws://localhost:7000'

// either of these will work:
// up.connect(url)
// up.connect(new WebSocket(url))
```


### up.send(message)

Send a `message` over the connection. If the connection is down, `message` gets buffered
until the connection is established, at which time it will send all buffered messages until
fully drained. The connection will be retried using a fibonacci sequence to determine how long
wait. Max wait time is 8 seconds per attempt


### up.close()

Closes the underlying websocket connection, clears any buffered unsent data, and don't attempt to reconnect.

Once this method is called, the upsocket instance is basically unusable. You'll need to instantiate a new
upsocket object.

TODO: perhaps a `reconnect()` method should be added to reactivate the underlying socket?


### up.subscribe(topic, handler)

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


### up.unsubscribe(topic, handler)

remove an event subscription handler. Useful if your code cares about cleaning up properly.

```javascript
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
