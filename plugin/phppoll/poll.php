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
define('READ_ONLY_SESSION', true);

// @codingStandardsIgnoreLine This script does not require login.
require_once(__DIR__ . '/../../../../../config.php');

// We do not want to call require_login() here because we don't want to update 'lastaccess' and keep session alive.

// Last event id seen.
$fromid = optional_param('fromid', 0, PARAM_INT);
// User id - we do not use cookies for performance reasons, the access will be validated separately.
$userid = optional_param('userid', 0, PARAM_INT);
// List of all channels user wants to receive updates from.
$channels = optional_param_array('channels', [], PARAM_RAW);
// Respective validation keys for each channel.
$keys = optional_param_array('key', [], PARAM_RAW);
// First 5 char of the user session id (to make sure they did not log out meanwhile).
$sidpart = optional_param('sid', '', PARAM_RAW);

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
    // Validate that the user is allowed to subscribe to each requested channel.
    // We use userid as the instance so it also validates that the key was issued to this user.
    // If validation fails, the script will throw an exception and in the JS the event 'CONNECTION_LOST' will be raised.
    foreach ($channels as $id => $hash) {
        require_user_key_login("realtimeplugin_phppoll:$hash", $userid, $keys[$id]);
    }

    // Validate that the user session is still active.
    // We check this in a loop because user session may end while we are still waiting.
    $hassessions = $DB->count_records_select(
        'sessions',
        'userid = ? AND sid LIKE ? AND timemodified >= ?',
        [$userid, $sidpart . '%', time() - $CFG->sessiontimeout]
    );
    if (strlen($sidpart) < 5 || !$hassessions) {
        throw new moodle_exception('sessionexpired');
    }

    // Collect new events from all channels.
    if ($events = $plugin->get_all($channels, (int)$fromid)) {
        // We have some notifications for this user - return them. The JS will then create a new request.
        echo json_encode(['success' => 1, 'events' => array_values($events)]);
        exit;
    }

    // Nothing new for this user. Sleep and check again.
    if (microtime(true) - $starttime > $maxduration) {
        echo json_encode(['success' => 1, 'events' => []]);
        exit;
    }
    usleep($sleepinterval);
}
