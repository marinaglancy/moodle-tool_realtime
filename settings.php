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
 * Plugin administration pages are defined here.
 *
 * @package     tool_realtime
 * @copyright   2020 Marina Glancy
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {

    $ADMIN->add('tools', new admin_category('realtime', new lang_string('pluginname', 'tool_realtime')));

    $ADMIN->add('reports', new admin_externalpage('tool_realtime_report',
        get_string('realtime:page', 'tool_realtime'),
        new moodle_url('/admin/tool/realtime/index.php')));


    $temp = new admin_settingpage('managerealtime', new lang_string('managerealtime', 'tool_realtime'));
    $temp->add(new \tool_realtime\setting_manageplugins());
    $ADMIN->add('realtime', $temp);

    $temp->add(new admin_setting_configselect('tool_realtime/enabled',
            new lang_string('enabledplugin', 'tool_realtime'),
            new lang_string('enabledplugindesc', 'tool_realtime'), 'phppoll',
            \tool_realtime\manager::get_installed_plugins_menu())
    );

    foreach (core_plugin_manager::instance()->get_plugins_of_type('realtimeplugin') as $plugin) {
        /** @var \tool_realtime\plugininfo\realtimeplugin $plugin */
        $plugin->load_settings($ADMIN, 'realtime', $hassiteconfig);
    }
}
