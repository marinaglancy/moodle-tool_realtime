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
 * Test settings page for Real time events
 *
 * @package    tool_realtime
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/adminlib.php');

admin_externalpage_setup('tool_realtime_testsettings');

$pluginname = \tool_realtime\manager::get_enabled_plugin_name();

echo $OUTPUT->header();

if (!$pluginname) {
    echo $OUTPUT->notification(get_string('testsettings_noplugin', 'tool_realtime'), 'warning');
    echo $OUTPUT->footer();
    die;
}

$plugin = \tool_realtime\manager::get_plugin();
if (!$plugin) {
    echo $OUTPUT->notification(get_string('testsettings_notsetup', 'tool_realtime'), 'warning');
    echo $OUTPUT->footer();
    die;
}

$fullname = 'realtimeplugin_' . $pluginname;
$displayname = get_string('pluginname', $fullname);
echo $OUTPUT->heading($displayname . '. ' . get_string('testsettings', 'tool_realtime'));

// Subscribe to the test channel.
$context = context_system::instance();
$channel = new \tool_realtime\channel($context, 'tool_realtime', 'test', 0);
$channel->subscribe();

$PAGE->requires->js_call_amd('tool_realtime/test_settings', 'init');

echo $OUTPUT->render_from_template('tool_realtime/test_settings', []);
echo $OUTPUT->footer();
