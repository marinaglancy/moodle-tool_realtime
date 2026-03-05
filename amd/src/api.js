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
 * API for sending data to the server via the realtime plugin.
 *
 * @module     tool_realtime/api
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Config from 'core/config';

let delegatedplugin = null;

/**
 * Can be used by any plugins to send data to server using the realtime API
 *
 * @param {String} component The Moodle component name, used to route the request to the correct callback
 * @param {Object} payload
 * @param {Boolean} noFallback used in test_settings - does not fallback to the Ajax if the delegated plugin failed.
 * @return {Promise}
 */
export function sendToServer(component, payload, noFallback = false) {
    if (!delegatedplugin || !delegatedplugin.sendToServer) {
       return sendToServerAjax(component, payload);
    }
    const promise = delegatedplugin.sendToServer(component, payload);
    if (noFallback) {
        return promise;
    }
    return promise.catch((error) => {
        window.console.error('Delegated plugin error: ', error);
        return sendToServerAjax(component, payload);
    });
}

/**
 * Used by realtime plugins to set the currently active implementation.
 *
 * The plugin must contain a method sendToServer(component, payload) that returns a Promise
 *
 * @param {Object} plugin
 */
export function setImplementation(plugin) {
    delegatedplugin = plugin;
}

/**
 * Send data to server by posting to push.php.
 *
 * @param {string} component
 * @param {Object} payload
 * @return {Promise}
 */
export async function sendToServerAjax(component, payload) {
    const pushUrl = Config.wwwroot + '/admin/tool/realtime/push.php';
    const query = 'sesskey=' + encodeURIComponent(Config.sesskey) +
        '&component=' + encodeURIComponent(component) +
        '&payload=' + encodeURIComponent(JSON.stringify(payload));
    const response = await fetch(pushUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        },
        body: query,
    });

    if (!response.ok) {
        throw new Error('Connection error. Request failed with status ' +
            response.status + ' ' + response.statusText);
    }

    let json;
    try {
        json = await response.json();
    } catch {
        throw new Error('Server returned invalid JSON');
    }

    if (json.error) {
        throw new Error(json.error);
    }
    return json.response ?? null;
}
