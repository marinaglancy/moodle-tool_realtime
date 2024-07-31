/**
 * Real time events using Pusher
 *
 * @module     realtimeplugin_pusher/realtime
 * @copyright  2020 Daniel Conquit, Matthew Gray, Nicholas Parker, Dan Thistlethwaite
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require.config({
    enforceDefine: false,
    paths: {
        "pusher-7.0": 'https://js.pusher.com/7.0/pusher'
    }
});

define(['core/pubsub', 'tool_realtime/events', 'pusher-7.0'], function(PubSub, RealTimeEvents, Pusher) {

    var params;
    var pubSub = PubSub;
    var realTimeEvents = RealTimeEvents;

    var plugin =  {
        init: function(userId, app_id, key, secret, cluster) {
            if (params && params.userid) {
                // Log console dev error.
            } else {
                params = {
                    app_id: app_id,
                    key: key,
                    secret: secret,
                    cluster: cluster
                };
            }
        },
        subscribe: function(hash, context, component, area, itemid, channel) {
            var pusher = new Pusher(params.key, {
                cluster: params.cluster
            });

            var pusherChannel = pusher.subscribe(hash);
            pusherChannel.bind('event', function(data) {
                let payload;
                try {
                    payload = JSON.parse(data);
                } catch (_) {
                    payload = [];
                }
                var dataToSend = {
                    context, component: component, area, itemid, channel, payload
                };
                pubSub.publish(realTimeEvents.EVENT, dataToSend);
            });
        }
    };
    return plugin;
});
