// This file is part of realtimeplugin_centrifugo plugin
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
 * Real time events using Centrifugo
 *
 * @module     realtimeplugin_centrifugo/realtime
 * @copyright  2025 Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as PubSub from 'core/pubsub';
import * as RealTimeEvents from 'tool_realtime/events';
import * as Ajax from 'core/ajax';
import * as api from 'tool_realtime/api';
import * as config from 'core/config';
import {Centrifuge, UnauthorizedError} from './centrifuge-lazy';

let params;
let centrifuge;

const sendToServer = (component, payload) => {
    return centrifuge.rpc('user.event', {component, sesskey: config.sesskey, payload})
        .then((response) => response.data);
};

/**
 * Initialise plugin
 *
 * @param {Array} initParams
 */
export function init(initParams) {
    params = initParams;
    centrifuge = new Centrifuge(params.host, {token: params.token, getToken: getToken});
    if (params.userpc) {
        api.setImplementation({sendToServer});
    }
}

const getToken = async() => {
    try {
        const response = await Ajax.call([{
            methodname: 'realtimeplugin_centrifugo_get_token',
            args: {},
        }])[0];
        params.token = response?.token;
    } catch (error) {
        params.token = null;
    }
    if (!params.token) {
        throw new UnauthorizedError();
    }
    return params.token;
};

/**
 * Subscribe to events
 *
 * @param {String} hash
 * @param {Object} properties
 */
export function subscribe(hash, properties) {

    centrifuge.on('disconnected', function() {
        PubSub.publish(RealTimeEvents.CONNECTION_LOST);
    });

    // Allocate Subscription to a channel.
    const sub = centrifuge.newSubscription(hash);

    // React on channel real-time publications.
    sub.on('publication', async(ctx) => {
        const payload = ctx.data.payload;
        var dataToSend = {...properties, payload};
        PubSub.publish(RealTimeEvents.EVENT, dataToSend);
    });

    // Trigger subscribe process.
    sub.subscribe();

    // Trigger actual connection establishement.
    centrifuge.connect();
}
