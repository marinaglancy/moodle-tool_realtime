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
 * Store management setting.
 *
 * @package    tool_realtime
 * @copyright  2020 Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace tool_realtime;

defined('MOODLE_INTERNAL') || die();

use core_text;
use html_writer;
use html_table;
use core_plugin_manager;

require_once("$CFG->libdir/adminlib.php");

/**
 * Class setting_manageplugins
 *
 * @package    tool_realtime
 * @copyright  2020 Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class setting_manageplugins extends \admin_setting {
    /**
     * Calls parent::__construct with specific arguments
     */
    public function __construct() {
        $this->nosave = true;
        parent::__construct('tool_realtime_manageui', get_string('managerealtime', 'tool_realtime'), '', '');
    }

    /**
     * Always returns true, does nothing.
     *
     * @return true
     */
    public function get_setting() {
        return true;
    }

    /**
     * Always returns true, does nothing.
     *
     * @return true
     */
    public function get_defaultsetting() {
        return true;
    }

    /**
     * Always returns '', does not write anything.
     *
     * @param mixed $data ignored
     * @return string Always returns ''
     */
    public function write_setting($data) {
        // Do not write any setting.
        return '';
    }

    /**
     * Checks if $query is one of the available log plugins.
     *
     * @param string $query The string to search for
     * @return bool Returns true if found, false if not
     */
    public function is_related($query) {
        if (parent::is_related($query)) {
            return true;
        }

        $query = core_text::strtolower($query);
        $plugins = manager::get_installed_plugins();
        foreach ($plugins as $plugin) {
            if (strpos(core_text::strtolower($plugin), $query) !== false) {
                return true;
            }
            $localised = get_string('pluginname', $plugin);
            if (strpos(core_text::strtolower($localised), $query) !== false) {
                return true;
            }
        }
        return false;
    }

    /**
     * Builds the XHTML to display the control.
     *
     * @param string $data Unused
     * @param string $query
     * @return string
     */
    public function output_html($data, $query = '') {
        global $OUTPUT, $PAGE;

        $strsettings = get_string('settings');
        $struninstall = get_string('uninstallplugin', 'core_admin');
        $strversion = get_string('version');
        $strenabled = get_string('enabled', 'core_admin');

        $pluginmanager = core_plugin_manager::instance();

        $return = $OUTPUT->heading(get_string('availableplugins', 'tool_realtime'), 3, 'main', true);
        $return .= $OUTPUT->box_start('generalbox realtimeui');

        $table = new html_table();
        $table->head = array(get_string('name'), $strversion, $strenabled, $strsettings, $struninstall);
        $table->colclasses = array('leftalign', 'centeralign', 'centeralign', 'centeralign', 'centeralign');
        $table->id = 'logstoreplugins';
        $table->attributes['class'] = 'admintable generaltable';
        $table->data = array();

        foreach (manager::get_installed_plugins_menu() as $plugin => $name) {
            $fullname = manager::PLUGINTYPE . '_' . $plugin;
            /** @var \tool_realtime\plugininfo\realtimeplugin $plugininfo */
            $plugininfo = $pluginmanager->get_plugin_info($fullname);
            $version = get_config($fullname, 'version') ?: '';

            $isenabled = $plugin === manager::get_enabled_plugin_name();
            $displayname = html_writer::span($name, $isenabled ? '' : 'dimmed_text');

            if ($PAGE->theme->resolve_image_location('icon', $fullname)) {
                $icon = $OUTPUT->pix_icon('icon', '', $fullname, ['class' => 'icon pluginicon']);
            } else {
                $icon = $OUTPUT->spacer();
            }

            // Settings link.
            $settings = '';
            if ($version && ($surl = $plugininfo->get_settings_url())) {
                $settings = html_writer::link($surl, $strsettings);
            }

            // Uninstall link.
            $uninstall = '';
            if ($uninstallurl = core_plugin_manager::instance()->get_uninstall_url($fullname, 'manage')) {
                $uninstall = html_writer::link($uninstallurl, $struninstall);
            }

            // Add a row to the table.
            $table->data[] = array($icon . $displayname, $version, $isenabled ? $strenabled : '', $settings, $uninstall);
        }

        $return .= html_writer::table($table);
        $return .= $OUTPUT->box_end();
        return highlight($query, $return);
    }
}
