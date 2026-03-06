# Real time events #

This plugin provides a framework for real-time communication between the server and client
in Moodle plugins. Depending on the enabled backend plugin, communication can be performed
via polling or websockets.

## Communication overview ##

```
  SERVER (PHP)                                          CLIENT (Browser JS)
  Multiple processes by same                            Single page session
  or different users or cron
 ┌───────────────────────────┐                         ┌─────────────────────────────┐
 │                           │    1. Page load         │                             │
 │ $channel->subscribe()   ──┼─>  (channel hash   ────>│  JS receives hash & key     │
 │ (userA)                   │    embedded in page)    │  and starts polling /       │
 │                           │                         │  opens websocket            │
 │                           │                         │                             │
 │───────────────────────────│                         │                             │
 │                           │    2. Server→Client     │                             │
 │ $channel->notify($data) ──┼─>  (polling response /  │  PubSub EVENT fired         │
 │ (other user, cron)        │    websocket message) ─>│  with event data            │
 │                           │                         │                             │
 │───────────────────────────│                         │                             │
 │                           │    3. Client→Server     │                             │
 │ PLUGIN_realtime_event_  <─┼──  (websocket or    <───┼─ RealTimeApi.sendToServer() │
 │   received() callback     │    web service)         │                             │
 │ (userA)                   │                         │                             │
 │                           │                         │                             │
 └───────────────────────────┘                         └─────────────────────────────┘
```

1. **Subscribe**: PHP registers the channel and embeds the channel hash in the
   page. The JS client uses this hash to authenticate polling or websocket requests.
2. **Server to client**: PHP calls `$channel->notify()` to store an event. The client
   receives it via polling or websocket and fires a PubSub EVENT.
3. **Client to server** (optional): JS sends data via `sendToServer()`. The server
   dispatches it to the plugin's `_realtime_event_received()` callback.

## How to use in plugins ##

### Channels ###

A channel uniquely identifies a communication path between server and client.
A hash is derived from the channel properties and embedded in the page during
subscription. JavaScript uses this hash to authenticate polling or websocket
requests — users cannot guess the hash of another channel.

Creating a new channel with the same properties always produces the same hash,
so the same channel object can be used for both subscribing and notifying.

### Subscribe and listen to events (client receives from server) ###

For security reasons, subscription is only allowed from PHP. The channel hash is
generated on the server and verified when polling, which ensures that attackers
cannot guess the channel from the JavaScript. For example, if you subscribe to
events in module 15, you cannot guess the channel hash for module 16.

Subscribe in PHP before rendering the page:
```php
$channel = new \tool_realtime\channel($context, $component, $area, $itemid, $channeldetails);
$channel->subscribe();
```

Listen in Javascript on the page:
```javascript
import * as PubSub from 'core/pubsub';
import * as RealTimeEvents from 'tool_realtime/events';

PubSub.subscribe(RealTimeEvents.EVENT, (eventData) => {
    const {component, area, itemid, contextid, payload} = eventData;
    if (component === 'mod_myplugin' && area === 'myarea') {
        console.log('Received payload', payload);
    }
});

// Optionally handle connection errors
PubSub.subscribe(RealTimeEvents.CONNECTION_LOST, (e) => {
    console.error('Connection lost', e);
});
```

### Notify subscribers from server (server sends to client) ###

Notifications can be sent from any PHP process — any user's session, or a cron
task. For example, a teacher updates course contents and all subscribed students
receive the update without reloading the page.

```php
$channel = new \tool_realtime\channel($context, $component, $area, $itemid, $channeldetails);
$channel->notify($payload); // $payload is an array
```

### Send data from client to server ###

Some backend plugins may enable bi-directional websockets, which means that
communication is faster when both receiving and sending data.

If bi-directional websockets are not available in the current backend plugin,
this will be performed via a Moodle AJAX request.

In Javascript, use the API module to send data to the server:
```javascript
import * as RealTimeApi from 'tool_realtime/api';

RealTimeApi.sendToServer('mod_myplugin', payload)
.then((response) => {
    console.log('Server response', response);
})
.catch((error) => {
    console.error('Error sending data to server', error);
});
```

### Handle client requests on server ###

If you send data from client to server using the realtime API described in the
previous section, you need to implement a callback function in your plugin's `lib.php`:

```php
/**
 * Callback for tool_realtime
 *
 * @param mixed $payload
 * @return array
 */
function PLUGINNAME_realtime_event_received($payload) {
    // The user who sent a request is already set as $USER.

    // Check permissions and perform action based on the payload.
    // Payload must be validated and sanitised as it can be tampered with by the malicious user.

    // You can return a JSON-encodable response that will be passed on to the JS caller.
    return [];
}
```

### Other uses ###

Check if the real-time API is available for a component in PHP:
```php
if (\tool_realtime\manager::is_enabled($component)) {
    // ...
}
```

## Examples ##

- **test_settings.php** - A test page to test real-time communication and demonstrate how to use the API in plugins.
- [mod_kahoodle](https://github.com/marinaglancy/moodle-mod_kahoodle) - A real-time quiz game
