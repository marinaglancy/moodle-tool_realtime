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
 * Plugin strings are defined here.
 *
 * @package     tool_realtime
 * @category    string
 * @copyright   2020 Marina Glancy
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['availableplugins'] = 'Available real time backend plugins';
$string['enabledplugin'] = 'Enabled real time backend plugin';
$string['enabledplugindesc'] = 'Select the real time backend plugin that is used on the site.';
$string['managerealtime'] = 'Manage Real time backend plugins';
$string['pluginname'] = 'Real time events';
$string['privacy:metadata'] = 'The Real time events plugin does not store any personal data.';
$string['subplugintype_realtimeplugin'] = 'Real time backend plugin';
$string['subplugintype_realtimeplugin_plural'] = 'Real time backend plugins';
$string['task_burst_test'] = 'Burst test events';
$string['testsettings'] = 'Test settings';
$string['testsettings_desc'] = 'This page allows you to test the real-time event delivery with the currently enabled backend plugin. The first section measures how quickly events sent from the server reach your browser (latency). The second section measures the round-trip time when your browser sends an event to the server and receives a response. For more detailed diagnostics, open your browser\'s developer tools and monitor the Network tab — for polling-based plugins you will see periodic HTTP requests, and for WebSocket-based plugins you can inspect individual messages in the WebSocket connection.';
$string['testsettings_avglatency'] = 'Avg latency';
$string['testsettings_avgroundtrip'] = 'Avg round-trip';
$string['testsettings_delay'] = 'Delay (ms):';
$string['testsettings_errors'] = 'Errors';
$string['testsettings_eventcount'] = 'Count:';
$string['testsettings_eventsreceived'] = 'Events received';
$string['testsettings_eventssent'] = 'Events sent';
$string['testsettings_minmaxlatency'] = 'Min / Max latency';
$string['testsettings_minmaxroundtrip'] = 'Min / Max round-trip';
$string['testsettings_noplugin'] = 'No real time backend plugin is enabled. Enable a plugin in the settings first.';
$string['testsettings_notsetup'] = 'The enabled real time backend plugin is not set up correctly.';
$string['testsettings_recalibrate'] = 'Recalibrate';
$string['testsettings_push_desc'] = 'Tests sending events from your browser to the server and measures round-trip time.';
$string['testsettings_push_heading'] = 'Event push (browser to server)';
$string['testsettings_push_results'] = 'Event push results';
$string['testsettings_receive_burst'] = 'Receive multiple events';
$string['testsettings_receive_desc'] = 'Tests how quickly events pushed from the server reach your browser. Latency measurements assume the browser and server clocks are synchronised.';
$string['testsettings_receive_heading'] = 'Event delivery (server to browser)';
$string['testsettings_receive_results'] = 'Event delivery results';
$string['testsettings_receive_single'] = 'Receive single event';
$string['testsettings_send_to_server'] = 'Send to server';
$string['testsettings_status'] = 'Status';
