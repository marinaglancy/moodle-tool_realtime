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
define('READ_ONLY_SESSION', true);
define('NO_SESSION_UPDATE', true);

// @codingStandardsIgnoreLine This script does not require login.
require_once(__DIR__ . '/../../../../../config.php');

// We do not want to call require_login() here because we don't want to update 'lastaccess' and keep session alive.

if (\tool_realtime\manager::get_enabled_plugin_name() !== 'phppoll') {
    echo json_encode(['error' => 'Plugin is not enabled']);
    exit;
}

/** @var realtimeplugin_phppoll\plugin $plugin */
$plugin = \tool_realtime\manager::get_plugin();

if (!isloggedin() || (isguestuser() && !$plugin->allow_guests())) {
    throw new \require_login_exception('');
}

// Last event id seen.
$fromid = optional_param('fromid', 0, PARAM_INT);
// List of all channels user wants to receive updates from.
$channels = optional_param_array('channels', [], PARAM_RAW);

// Validate requested channels against subscriptions stored in the session.
$subscribedchannels = $SESSION->realtimephppollchannels ?? [];
foreach ($channels as $hash) {
    if (!isset($subscribedchannels[$hash])) {
        echo json_encode(['error' => 'Invalid channel']);
        exit;
    }
}

// Save session id and close the session to release the lock before the long-polling loop.
$sid = session_id();
\core\session\manager::write_close();

core_php_time_limit::raise();
$starttime = microtime(true);
$maxduration = $plugin->get_request_timeout(); // In seconds as float.
$sleepinterval = $plugin->get_delay_between_checks() * 1000; // In microseconds.

while (true) {
    // Validate that the user session is still active.
    // We check this in a loop because user session may end while we are still waiting.
    $session = \core\session\manager::get_session_by_sid($sid);
    if (empty($session->sid) || (!empty($session->userid) && !isguestuser($session->userid)
            && $session->timemodified < time() - $CFG->sessiontimeout)) {
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
