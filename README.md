# Real time events #

This plugin provides a framework for real-time communication between the server and client
in Moodle plugins. Depending on the enabled backend plugin, communication can be performed
via polling or websockets.

## How to use in plugins ##

### Channel parameters ###

A channel is defined by the following parameters:
- `$context` - The Moodle context (e.g., course module context)
- `$component` - Your plugin's frankenstyle name (e.g., 'mod_kahoodle')
- `$area` - A string identifying the communication area (e.g., 'game', 'gamemaster')
- `$itemid` - An integer identifier, often used to target specific users (e.g., player ID, 0 for broadcast)
- `$channeldetails` - Optional additional channel identifier string

### Subscribe and listen to events (client receives from server) ###

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

```php
$channel = new \tool_realtime\channel($context, $component, $area, $itemid, $channeldetails);
$channel->notify($payload); // $payload is an array
```

### Send data from client to server ###

In Javascript, use the API module to send data to the server:
```javascript
import * as RealTimeApi from 'tool_realtime/api';

RealTimeApi.sendToServer({
    contextid: contextId,
    component: 'mod_myplugin',
    area: 'myarea',
    itemid: 0,
}, {
    action: 'myaction',
    // ... additional payload data
});
```

### Handle client requests on server ###

Implement a callback function in your plugin's `lib.php`:
```php
/**
 * Callback for tool_realtime
 *
 * @param \tool_realtime\channel $channel
 * @param mixed $payload
 * @return array
 */
function PLUGINNAME_realtime_event_received($channel, $payload) {
    // Process the request and optionally notify other subscribers
    $props = $channel->get_properties(); // contextid, component, area, itemid, channeldetails

    // Example: notify other clients about the update
    $notifyChannel = new \tool_realtime\channel($context, 'mod_myplugin', 'updates', 0);
    $notifyChannel->notify(['updated' => true]);

    return [];
}
```

### Available JS events ###

The `tool_realtime/events` module exports:
- `EVENT` - Fired when a real-time event is received from the server
- `CONNECTION_LOST` - Fired when the connection to the server is lost
- `UPDATE_FAILED` - Fired when an update operation fails

### Other uses ###

Check if area is enabled in PHP:
```php
if (\tool_realtime\manager::is_enabled($component, $area)) {
    // ...
}
```

## Examples ##

- [mod_kahoodle](https://github.com/marinaglancy/moodle-mod_kahoodle) - A Kahoot-style quiz game
- [mod_rplace (inspired by reddit r/place)](https://github.com/marinaglancy/moodle-mod_rplace)
