/**
 * Real time events using Pusher
 *
 * @module     realtimeplugin_pusher/realtime
 * @package    realtimeplugin_pusher
 * @copyright  2020 Daniel Conquit, Matthew Gray, Nicholas Parker, Dan Thistlethwaite
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require.config({
    enforceDefine: false,
    paths: {
        "pusher-7.0": 'https://js.pusher.com/7.0/pusher'
    }
});

define(['core/pubsub', 'tool_realtime/events', 'pusher-7.0', 'tool_realtime/api'], function(PubSub, RealTimeEvents, Pusher, api) {

    var params;
    var channels = [];
    var pubSub = PubSub;
    var realTimeEvents = RealTimeEvents;
    var subToChannel = function(context, component, area, itemid) {
        var pusher = new Pusher(params.key, {
            cluster: params.cluster
        });

        var channelString = context + '-' + component + '-' + area + '-' + itemid;

        var channel = pusher.subscribe(channelString);
        channel.bind('event', function(data) {
            var channelObj = channelString.split('-');
            var payload = JSON.parse(data);
            var dataToSend = {"itemid" : channelObj[3], "component" : channelObj[1], "area" : channelObj[2], "payload" : payload};
            pubSub.publish(realTimeEvents.EVENT, dataToSend);
        });
    };

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
            api.setImplementation(plugin);
        },
        subscribe: function(context, component, area, itemid, fromId, fromTimeStamp) {
            var channeltosubto = {
                context: context,
                component: component,
                area: area,
                fromid: fromId,
                fromtimestamp: fromTimeStamp
            };
            if(channeltosubto) {
                channels.push(channeltosubto);
            }
            subToChannel(context, component, area, itemid);
        }
    };
    return plugin;
});
