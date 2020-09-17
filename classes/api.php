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

/**
 * Class api
 *
 * @package     tool_realtime
 * @copyright   2020 Moodle Pty Ltd <support@moodle.com>
 * @author      2020 Marina Glancy
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @license     Moodle Workplace License, distribution is restricted, contact support@moodle.com
 */

namespace tool_realtime;

defined('MOODLE_INTERNAL') || die();

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
     */
    public static function subscribe(\context $context, string $component, string $area, int $itemid) {
        if (self::is_enabled($component, $area)) {
            manager::get_plugin()->subscribe($context, $component, $area, $itemid);
        }
    }

    /**
     * SEt up realtime tool
     */
    public static function init() {
        if (self::is_enabled('fakecomponent', 'fakearea')) {
            manager::get_plugin()->init();
        }
    }

    /**
     * Notifies all subscribers about an event
     *
     * @param \context $context
     * @param string $component
     * @param string $area
     * @param int $itemid
     * @param array|null $payload
     */
    public static function notify(\context $context, string $component, string $area, int $itemid, ?array $payload = null) {
        if (self::is_enabled($component, $area)) {
            manager::get_plugin()->notify($context, $component, $area, $itemid, $payload);
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
        // TODO.
        return true;
    }
}
