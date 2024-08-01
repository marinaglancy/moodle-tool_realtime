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
 * Real time events using Pusher
 *
 * @module     realtimeplugin_pusher/realtime
 * @copyright  2020 Daniel Conquit, Matthew Gray, Nicholas Parker, Dan Thistlethwaite
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require.config({
    paths: {
        "pusher": 'https://js.pusher.com/7.0/pusher'
    }
});

import * as PubSub from 'core/pubsub';
import * as RealTimeEvents from 'tool_realtime/events';

let params;

/**
 * Initialise plugin
 *
 * @param {String} key
 * @param {String} cluster
 */
export function init(key, cluster) {
    params = {
        key,
        cluster
    };
}

/**
 * Subscribe to events
 *
 * @param {String} hash
 * @param {Object} properties
 */
export function subscribe(hash, properties) {
    require(['pusher'], function(Pusher) {
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
            var dataToSend = {...properties, payload};
            PubSub.publish(RealTimeEvents.EVENT, dataToSend);
        });
    });
}
