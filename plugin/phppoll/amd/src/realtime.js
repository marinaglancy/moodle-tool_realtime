/**
 * Real time events
 *
 * @module     realtimeplugin_phppoll/realtime
 * @package    realtimeplugin_phppoll
 * @copyright  2020 Marina Glancy
 */
define(['core/pubsub', 'tool_realtime/events'], function(PubSub, RealTimeEvents) {

    var params;
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
            encodeURIComponent(params.token) + '&fromid=' + encodeURIComponent(params.fromid)
            + '&channel=' + encodeURIComponent(params.context) + ':' +
            encodeURIComponent(params.component) + ':' + encodeURIComponent(params.area) +
            ':' + encodeURIComponent(params.itemid);
        ajax.open('GET', url, true);
        ajax.send();
    };

    return {
        init: function(userId, token, context, component, area, itemid, fromId, pollURLParam, timeout) {
            if (params && params.userid) {
                // Already initialised.
                ajax.abort();
                params.context += ('-' + context);
                params.component += ('-' + component);
                params.area += ('-' + area);
                params.itemid += ('-' + itemid);
            } else {
                params = {
                    userid: userId,
                    token: token,
                    context: context,
                    component: component,
                    area: area,
                    itemid: itemid,
                    fromid: fromId,
                    timeout: timeout,
                };
            }
            pollURL = pollURLParam;
            setTimeout(poll, timeout);
        }
    };
});
