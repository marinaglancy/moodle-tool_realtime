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
 * Class manager
 *
 * @package     tool_realtime
 * @copyright   2020 Marina Glancy
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace tool_realtime;

defined('MOODLE_INTERNAL') || die();

/**
 * Class manager
 *
 * @package     tool_realtime
 * @copyright   2020 Marina Glancy
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class manager {
    public static function get_available_plugins(): array {
        $plugins = \core_component::get_plugin_list_with_class('realtimeplugin', 'plugin');
        return array_keys($plugins);
    }

    public static function get_enabled_plugin(): string {
        return 'phppoll'; // TODO.
    }
}
