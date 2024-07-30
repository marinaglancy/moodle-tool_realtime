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
 * Poll for updates.
 *
 * @package     realtimeplugin_phppoll
 * @copyright   2020 Marina Glancy
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @license     Moodle Workplace License, distribution is restricted, contact support@moodle.com
 */

define('AJAX_SCRIPT', true);
define('NO_MOODLE_COOKIES', true);
// @codingStandardsIgnoreLine This script does not require login.
require_once(__DIR__ . '/../../../../../config.php');

// We do not want to call require_login() here because we don't want to update 'lastaccess' and keep session alive.
// Last event id seen.
$fromid = optional_param('fromid', 0, PARAM_INT);
// Last event id seen.

// Who is the current user making request.
$userid = optional_param('userid', 0, PARAM_INT);
$token = optional_param('token', '', PARAM_RAW);
// Explode parameter strings.
$paramarray = explode(':', optional_param('channel', '', PARAM_RAW));
$contextunprocessed = $paramarray[0];
$context = explode('-', $contextunprocessed);
$componentunprocessed = $paramarray[1];
$component = explode('-', $componentunprocessed);
$areaunprocessed = $paramarray[2];
$area = explode('-', $areaunprocessed);
$itemidunprocessed = $paramarray[3];
$itemid = explode('-', $itemidunprocessed);
$fromtimestamp = $paramarray[4];
$fromtimestampprocessed = explode('-', $fromtimestamp);

if (\tool_realtime\manager::get_enabled_plugin_name() !== 'phppoll') {
    echo json_encode(['error' => 'Plugin is not enabled']);
    exit;
}

core_php_time_limit::raise();
$starttime = microtime(true);
/** @var realtimeplugin_phppoll\plugin $plugin */
$plugin = \tool_realtime\manager::get_plugin();
$maxduration = $plugin->get_request_timeout(); // In seconds as float.
$sleepinterval = $plugin->get_delay_between_checks() * 1000; // In microseconds.

while (true) {
    if (!$plugin->validate_token($userid, $token)) {
        // User is no longer logged in or token is wrong. Do not poll any more.
        // We check this in a loop because user session may end while we are still waiting.
        echo json_encode(['error' => 'Can not find an active user session']);
        exit;
    }

    //TODO: check user rights to subscribe to channel.

    for ($x = 0; $x < count($component); $x++) {
        if ($events = $plugin->get_all((intval($context[$x])), (int)$fromid, (string)$component[$x],
            (string)$area[$x], (int)$itemid[$x], (float)$fromtimestampprocessed[$x])) {
            // We have some notifications for this user - return them. The JS will then create a new request.
            echo json_encode(['success' => 1, 'events' => array_values($events)]);
        }
        if (count($events) > 0) {
            exit;
        }
    }

    // Nothing new for this user. Sleep and check again.
    if (microtime(true) - $starttime > $maxduration) {
        echo json_encode(['success' => 1, 'events' => []]);
        exit;
    }
    usleep($sleepinterval);
}
