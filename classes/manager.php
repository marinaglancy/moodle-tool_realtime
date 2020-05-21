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

    /** @var string */
    const PLUGINTYPE = 'realtimeplugin';

    /**
     * List of available backend plugins
     *
     * @return array
     */
    public static function get_installed_plugins(): array {
        $plugins = \core_component::get_plugin_list_with_class(self::PLUGINTYPE, 'plugin');
        $res = [];
        foreach (array_keys($plugins) as $fullname) {
            list($type, $name) = \core_component::normalize_component($fullname);
            $res[$name] = $fullname;
        }
        return $res;
    }

    /**
     * Returns the list of installed plugins sorted by name
     *
     * @return array
     */
    public static function get_installed_plugins_menu(): array {
        $plugins = self::get_installed_plugins();
        $menu = [];
        foreach ($plugins as $name => $fullname) {
            if (get_string_manager()->string_exists('pluginname', $fullname)) {
                $displayname = get_string('pluginname', $fullname);
            } else {
                $displayname = $name;
            }
            $menu[$name] = $displayname;
        }
        asort($menu);
        return $menu;
    }

    /**
     * Name of the enabled backend plugin
     *
     * @return string
     */
    public static function get_enabled_plugin_name(): string {
        $selected = get_config('tool_realtime', 'enabled');
        $all = self::get_installed_plugins();
        if (strlen($selected) && array_key_exists($selected, $all)) {
            return $selected;
        }
        if (array_key_exists('phppoll', $all)) {
            return 'phppoll';
        }
        return key($all);
    }

    /**
     * Returns an instance of the enabled backend plugin
     *
     * @return plugin_base
     */
    public static function get_plugin(): plugin_base {
        // TODO check for errors, return singleton?
        $plugins = \core_component::get_plugin_list_with_class(self::PLUGINTYPE, 'plugin');
        $classname = $plugins[self::PLUGINTYPE . '_' . self::get_enabled_plugin_name()];
        return new $classname();
    }
}
