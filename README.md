# Real time events #

## How to use in plugins ##

### Notify about an event in PHP: ###

```
\tool_realtime\api::notify($context, $component, $area, $itemid, $channel, $payload);
```

### Subscribe and listen to events: ###

Subscribe in PHP before rendering the page:
```
\tool_realtime\api::subscribe($context, $component, $area, $itemid, $channel);
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
if (\tool_realtime\api::is_enabled($component, $area)) {
    // ...
}
```

### Examples ###

[mod_rplace (inspired by reddit r/place)](https://github.com/marinaglancy/moodle-mod_rplace)
