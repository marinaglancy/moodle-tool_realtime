// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Real time events
 *
 * @module     realtimeplugin_phppoll/realtime
 * @copyright  2020 Marina Glancy
 */

import * as PubSub from 'core/pubsub';
import * as RealTimeEvents from 'tool_realtime/events';

var params;
var channels = [];
var requestscounter = [];
var pollURL;
var ajax = new XMLHttpRequest();

/**
 * Make sure we don't send requests too often
 *
 * @returns {Boolean}
 */
function checkRequestCounter() {
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
}

/**
 * Polls for events, schedules the next poll
 */
function poll() {
    if (!checkRequestCounter()) {
        // Too many requests, stop polling.
        return;
    }
    ajax.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            if (this.status === 200) {
                let json;
                try {
                    json = JSON.parse(this.responseText);
                } catch {
                    setTimeout(poll, params.timeout);
                    return;
                }
                if (!json.success || json.success !== 1) {
                    // Poll.php returned an error or an exception. Stop trying to poll.
                    PubSub.publish(RealTimeEvents.CONNECTION_LOST);
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

    if (channels.length <= 0) {
        return;
    }
    let query = 'userid=' + encodeURIComponent(params.userid) +
        '&token=' + encodeURIComponent(params.token) +
        '&fromid=' + encodeURIComponent(params.fromid);
    for (let i = 0; i < channels.length; i++) {
        query += `&channels[${i}]=` + encodeURIComponent(channels[i]);
    }

    ajax.open('POST', pollURL, true);
    ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    ajax.send(query);
}

/**
 * Initialise plugin
 *
 * @param {Number} userId
 * @param {String} token
 * @param {String} pollURLParam
 * @param {Number} timeout
 */
export function init(userId, token, pollURLParam, timeout) {
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
}

/**
 * Subscribe to events
 *
 * @param {String} hash
 * @param {Object} properties
 * @param {Number} fromId
 */
export function subscribe(hash, properties, fromId) {
    params.fromid = fromId;
    channels.push(hash);
    setTimeout(poll, params.timeout);
}
