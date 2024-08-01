# Real time events #

## How to use in plugins ##

### Notify about an event in PHP: ###

```
$channel = new \tool_realtime\channel($context, $component, $area, $itemid, $channeldetails);
$channel->notify($payload);
```

### Subscribe and listen to events: ###

Subscribe in PHP before rendering the page:
```
$channel = new \tool_realtime\channel($context, $component, $area, $itemid, $channeldetails);
$channel->subscribe();
```
Listen in Javascript on the page:
```
import * as PubSub from 'core/pubsub';
import * as RealTimeEvents from 'tool_realtime/events';

PubSub.subscribe(RealTimeEvents.EVENT, (eventData) => {
    if (eventData.component === 'mycomponent' && eventData.area === 'myarea') {
        console.log('Received event', eventData);
    }
});
```

### Other uses ###

Check if area is enabled in PHP:
```
if (\tool_realtime\manager::is_enabled($component, $area)) {
    // ...
}
```

### Examples ###

[mod_rplace (inspired by reddit r/place)](https://github.com/marinaglancy/moodle-mod_rplace)
