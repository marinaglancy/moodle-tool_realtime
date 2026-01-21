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

use core\exception\coding_exception;

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
            [$type, $name] = \core_component::normalize_component($fullname);
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
     * Name of the enabled backend plugin or null if no plugin is enabled
     *
     * @return string|null
     */
    public static function get_enabled_plugin_name(): ?string {
        $selected = get_config('tool_realtime', 'enabled');
        $all = self::get_installed_plugins();
        if (strlen($selected) && array_key_exists($selected, $all)) {
            return $selected;
        }
        return null;
    }

    /**
     * Returns an instance of the enabled backend plugin
     *
     * @return plugin_base
     */
    public static function get_plugin(): ?plugin_base {
        $enabledpluginname = self::get_enabled_plugin_name();
        if (!$enabledpluginname) {
            return null;
        }

        $plugins = \core_component::get_plugin_list_with_class(self::PLUGINTYPE, 'plugin');
        /** @var plugin_base $classname */
        $classname = $plugins[self::PLUGINTYPE . '_' . $enabledpluginname];
        $instance = $classname::get_instance();

        return $instance->is_set_up() ? $instance : null;
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

    /**
     * Invoked when an event is received from the backend
     *
     * @param array $channelproperties
     * @param mixed $payload
     * @throws \core\exception\coding_exception
     * @return array
     */
    public static function event_received(array $channelproperties, $payload): array {
        $channel = channel::create_from_properties($channelproperties);
        $component = $channel->get_properties()['component'];
        $res = component_callback($component, 'realtime_event_received', [$channel, $payload]);
        if ($res && !is_array($res)) {
            throw new coding_exception('Callback ' . $component . '_realtime_event_received returned value with an invalid type');
        }
        return $res ?: [];
    }
}
