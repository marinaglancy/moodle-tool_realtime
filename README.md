# Real time events #

## How to use in plugins ##

### Notify about an event in PHP: ###

```
\tool_realtime\api::notify($context, $component, $area, $itemid, $payload);
```

### Subscribe and listen to events: ###

Subscribe in PHP:
```
\tool_realtime\api::subscribe($context, $component, $area, $itemid);
```
Listen in Javascript:
```
require(['core/pubsub', 'tool_realtime/events'], function(PubSub, RealTimeEvents) {
    PubSub.subscribe(RealTimeEvents.EVENT, function(context, component, area, itemid, payload) {
        // ...
    });
});
```
or
```
import {subscribe} from 'core/pubsub';
import RealTimeEvents from 'tool_realtime/events';

subscribe(RealTimeEvents.EVENT, (eventData) => {
    // ...
});
```

### Other uses ###

Check if area is enabled in PHP:
```
if (\tool_realtime\api::is_enabled($component, $area)) {
    // ...
}
```


TODO: Connection lost JS event, change the favicon, etc.