/**
 * Real time events
 *
 * @module     realtimeplugin_phppoll/realtime
 * @package    realtimeplugin_phppoll
 * @copyright  2020 Marina Glancy
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
    var subToChannel = function() {
        var pusher = new Pusher(params.key, {
            cluster: params.cluster
        });

        var channelString = params.context + '-' + params.component + '-' + params.area + '-' + params.itemid;

        var channel = pusher.subscribe(channelString);
        channel.bind('event', function(data) {
            var channelObj = channelString.split('-');
            var payload = JSON.parse(data);
            var dataToSend = {"itemid" : channelObj[3], "component" : channelObj[1], "area" : channelObj[2], "payload" : payload};
            pubSub.publish(realTimeEvents.EVENT, dataToSend);
        });
    };

    return {
        init: function(userId, context, component, area, itemid, app_id, key, secret, cluster) {
            params = {
                userid: userId,
                context: context,
                component: component,
                area: area,
                itemid: itemid,
                app_id: app_id,
                key: key,
                secret: secret,
                cluster: cluster
            };
            subToChannel();
        }

    };
});
