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
var pollTimer = null;

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
 * Schedule the next poll if one is not already scheduled or in-flight
 */
function schedulePoll() {
    if (pollTimer === null) {
        pollTimer = setTimeout(poll, params.timeout);
    }
}

/**
 * Abort any in-flight request and pending timer, then schedule a fresh poll
 */
function restartPoll() {
    if (pollTimer !== null) {
        clearTimeout(pollTimer);
        pollTimer = null;
    }
    // Abort in-flight request so it doesn't reschedule on completion.
    if (ajax.readyState !== 0 && ajax.readyState !== 4) {
        ajax.abort();
    }
    schedulePoll();
}

/**
 * Polls for events, schedules the next poll
 */
function poll() {
    pollTimer = null;
    if (!checkRequestCounter()) {
        // Too many requests, stop polling.
        return;
    }

    if (channels.length <= 0) {
        return;
    }

    ajax.onreadystatechange = function() {
        if (this.readyState !== 4) {
            return;
        }
        // Status 0 means the request was aborted - don't reschedule, the caller handles it.
        if (this.status === 0) {
            return;
        }
        if (this.status === 200) {
            let json;
            try {
                json = JSON.parse(this.responseText);
            } catch {
                schedulePoll();
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
        }
        // Schedule next poll for both successful and failed (non-abort) responses.
        schedulePoll();
    };

    let query = 'userid=' + encodeURIComponent(params.userid) +
        '&fromid=' + encodeURIComponent(params.fromid) +
        '&sid=' + encodeURIComponent(params.sid);
    for (let i = 0; i < channels.length; i++) {
        query += `&channels[${i}]=` + encodeURIComponent(channels[i].hash);
        query += `&key[${i}]=` + encodeURIComponent(channels[i].key);
    }

    ajax.open('POST', pollURL, true);
    ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    ajax.send(query);
}

/**
 * Initialise plugin
 *
 * @param {Number} userId
 * @param {String} pollURLParam
 * @param {Number} timeout
 * @param {String} sid
 */
export function init(userId, pollURLParam, timeout, sid) {
    if (params && params.userid) {
        // Log console dev error.
    } else {
        params = {
            userid: userId,
            timeout: timeout,
            sid
        };
    }
    pollURL = pollURLParam;
}

/**
 * Subscribe to events
 *
 * @param {String} hash
 * @param {String} key
 * @param {Number} fromId
 */
export function subscribe(hash, key, fromId) {
    params.fromid = fromId;
    channels.push({hash, key});
    restartPoll();
}
