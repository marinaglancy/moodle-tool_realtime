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
 * TODO describe module api
 *
 * @module     tool_realtime/api
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Ajax from 'core/ajax';

let delegatedplugin = null;

/**
 * Can be used by any plugins to send data to server using the realtime API
 *
 * @param {Object} channel object with attributes component, area, itemid, channeldetails
 * @param {Object} payload
 * @return {Promise}
 */
export function sendToServer(channel, payload) {
    if (!delegatedplugin || !delegatedplugin.sendToServer) {
       return sendToServerAjax(channel, payload);
    }
    return delegatedplugin.sendToServer({
        contextid: channel.contextid,
        component: channel.component,
        area: channel.area,
        itemid: parseInt(channel.itemid ?? 0),
        channeldetails: channel.channeldetails,
    }, payload);
}

/**
 * Used by realtime plugins to set the currently active implementation.
 *
 * The plugin must contain a method sendToServer(channel, payload) that returns a Promise
 *
 * @param {Object} plugin
 */
export function setImplementation(plugin) {
    delegatedplugin = plugin;
}

/**
 *
 * @param {Object} channel
 * @param {Object} payload
 */
export function sendToServerAjax(channel, payload) {
    return Ajax.call([{
        methodname: 'tool_realtime_request',
        args: {
            channel: JSON.stringify(channel), payload: JSON.stringify(payload)
        }
    }]).then((responses) => {
        return responses[0].response;
    });
}
