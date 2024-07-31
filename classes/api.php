<?php
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

namespace tool_realtime;

/**
 * Class api
 *
 * @package     tool_realtime
 * @copyright   2020 Moodle Pty Ltd <support@moodle.com>
 * @author      2020 Marina Glancy
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @license     Moodle Workplace License, distribution is restricted, contact support@moodle.com
 */
class api {

    /**
     * Subscribe the current page to receive notifications about events
     *
     * @param \context $context
     * @param string $component
     * @param string $area
     * @param int $itemid
     * @param string $channel the same channel that is used when sending notification,
     *    for example, target user id.
     */
    public static function subscribe(
            \context $context,
            string $component,
            string $area,
            int $itemid,
            string $channel) {
        if (self::is_enabled($component, $area) && ($plugin = manager::get_plugin())) {
            $plugin->subscribe($context, $component, $area, $itemid, $channel);
        }
    }

    /**
     * Notifies a subscriber about an event
     *
     * Notification is only delivered to the FIRST person who subscribes to it.
     *
     * @param \context $context
     * @param string $component
     * @param string $area
     * @param int $itemid
     * @param string $channel any description of the communication channel, for example, id of the target user
     *    or md5 of several properties.
     * @param array|null $payload
     */
    public static function notify(
            \context $context,
            string $component,
            string $area,
            int $itemid,
            string $channel,
            ?array $payload = null) {
        if (self::is_enabled($component, $area) && ($plugin = manager::get_plugin())) {
            $plugin->notify($context, $component, $area, $itemid, $channel, $payload);
        }
    }

    /**
     * Checks if the given area is enabled
     *
     * @param string $component
     * @param string $area
     * @return bool
     */
    public static function is_enabled(string $component, string $area) {
        // TODO this function exists in case we want to provide UI for selective enabling/disabling areas.
        return true;
    }

    public static function channel_hash(\context $context, string $component, string $area, int $itemid, string $channel) {
        $params = ['contextid' => (string)$context->id,
            'component' => (string)$component,
            'area' => (string)$area,
            'itemid' => (string)$itemid,
            'channel' => (string)$channel];
        return md5(json_encode($params));
    }
}
