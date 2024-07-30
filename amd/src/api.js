/**
 * Real time events
 *
 * @module     tool_realtime/events
 * @package    tool_realtime
 * @copyright  2020 Marina Glancy
 */
define(['core/pubsub', 'tool_realtime/events'], function(PubSub, RealTimeEvents) {

    document.listofchannels = [];

    return {
        setImplementation: function(plugin) {
            var totalchannels;
            document.delegatedplugin = plugin;
            // in here check list to subscribe once plugin has been set
            if(!document.listofchannels) {
                return;
            }
            totalchannels = document.listofchannels.length;

            if (totalchannels > 0) {
                for (var i = 0; i < totalchannels; i++) {
                    var channeltosub = document.listofchannels.shift();
                    document.delegatedplugin.subscribe( channeltosub.context,
                                                        channeltosub.component,
                                                        channeltosub.area,
                                                        channeltosub.itemid,
                                                        channeltosub.fromid,
                                                        channeltosub.fromtimestamp);
                }
            }
        },
        subscribe: function(context, component, area, itemid, fromId= 0, fromtimestamp = -1) {
            var fromTimeStamp = fromtimestamp;

            if(fromId == 0) {
                fromTimeStamp= (new Date).getTime();
            }

            // Check that plugin implementation has been set.
            if (document.delegatedplugin) {
                //  conditional for plugin being set
                document.delegatedplugin.subscribe(context, component, area, itemid, fromId, fromTimeStamp);
            } else {
                // Channel object to store in list
                var channel = {
                    context: context,
                    component: component,
                    area: area,
                    itemid: itemid,
                    fromid: fromId,
                    fromtimestamp: fromTimeStamp
                };
                // push channel to list
                document.listofchannels.push(channel);
            }

        },
        getPlugin: function() {
            return document.delegatedplugin;
        }
    };
});
