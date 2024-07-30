/**
 * Real time events
 *
 * @module     realtimeplugin_phppoll/realtime
 * @package    realtimeplugin_phppoll
 * @copyright  2020 Marina Glancy
 */
define(['core/pubsub', 'tool_realtime/events', 'tool_realtime/api'], function(PubSub, RealTimeEvents,api) {

    var params;
    var channels = [];
    var requestscounter = [];
    var pollURL;
    var ajax = new XMLHttpRequest(), json;

    var checkRequestCounter = function() {
        var curDate = new Date(),
            curTime = curDate.getTime();
        requestscounter.push(curTime);
        requestscounter = requestscounter.slice(-10);
        // If there were 10 requests in less than 5 seconds, it must be an error. Stop polling.
        if (requestscounter.length >= 10 && curTime - requestscounter[0] < 5000) {
            PubSub.publish(RealTimeEvents.CONNECTION_LOST);
            return false;
        }
        return true;
    };

    var poll = function() {
        if (!checkRequestCounter()) {
            // Too many requests, stop polling.
            return;
        }
        ajax.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                if (this.status === 200) {
                    try {
                        json = JSON.parse(this.responseText);
                    } catch {
                        setTimeout(poll, params.timeout);
                        return;
                    }
                    if (!json.success || json.success !== 1) {
                        // Poll.php returned an error or an exception. Stop trying to poll.
                        return;
                    }

                    // Process results - trigger all necessary Javascript/jQuery events.
                    var events = json.events;
                    for (var i in events) {
                        PubSub.publish(RealTimeEvents.EVENT, events[i]);
                        // Remember the last id.
                        params.fromid = events[i].id;
                    }
                    // And start polling again.
                    setTimeout(poll, params.timeout);
                } else {
                    // Must be a server timeout or loss of network - start new process.
                    setTimeout(poll, params.timeout);
                }
            }
        };
        var url = pollURL + '?userid=' + encodeURIComponent(params.userid) + '&token=' +
            encodeURIComponent(params.token) + '&fromid=' + encodeURIComponent(params.fromid);

        if(channels.length <= 0) {
            return;
        }

        var contextstring = "";
        var componentstring = "";
        var areastring = "";
        var itemidstring = "";
        var fromtimestampstring = "";

        for (var i = 0; i < channels.length; i++) {
            if (i == channels.length - 1) {
                contextstring += channels[i].context;
                componentstring += channels[i].component;
                areastring += channels[i].area;
                itemidstring += channels[i].itemid;
                fromtimestampstring += channels[i].fromtimestamp;
            } else {
                contextstring += channels[i].context + '-';
                componentstring += channels[i].component + '-';
                areastring += channels[i].area + '-';
                itemidstring += channels[i].itemid + '-';
                fromtimestampstring += channels[i].fromtimestamp + '-';
            }
        }

        var channelstring = '&channel=' + contextstring + ':'
                                        + componentstring + ':'
                                        + areastring + ':'
                                        + itemidstring + ':'
                                        + fromtimestampstring;

        url += channelstring;

        ajax.open('GET', url, true);
        ajax.send();
    };

    var plugin =  {
        init: function(userId, token, pollURLParam, timeout) {
            if (params && params.userid) {
                // Log console dev error.
            } else {
                params = {
                    userid: userId,
                    token: token,
                    timeout: timeout,
                };
            }
            pollURL = pollURLParam;
            api.setImplementation(plugin);
        },
        subscribe: function(context, component, area, itemid, fromId, fromTimeStamp) {
            params.fromid = fromId;
            var channeltosubto = {
                                    context: context,
                                    component: component,
                                    area: area,
                                    itemid: itemid,
                                    fromtimestamp: fromTimeStamp,
                                };
            if(channeltosubto) {
                channels.push(channeltosubto);
            }
            console.log(channels);
            setTimeout(poll, params.timeout);
        }
    };
    return plugin;
});
