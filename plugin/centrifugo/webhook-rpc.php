<?php
// This file is part of realtimeplugin_centrifugo plugin
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
 * Centrifugo RPC proxy endpoint for handling client-to-server events.
 *
 * @package    realtimeplugin_centrifugo
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

use tool_realtime\manager;

define('NO_MOODLE_COOKIES', true);
define('AJAX_SCRIPT', true);
define('NO_DEBUG_DISPLAY', true);

require('../../../../../config.php');

/** @var \realtimeplugin_centrifugo\plugin $plugin */
$plugin = manager::get_plugin();
if (!$plugin || !($plugin instanceof \realtimeplugin_centrifugo\plugin)) {
    echo json_encode(['error' => ['code' => 500, 'message' => 'Plugin centrifugo is not enabled']]);
    exit;
}

if (!$plugin->use_rpc()) {
    echo json_encode(['error' => ['code' => 500, 'message' => 'Plugin centrifugo is not configured to receive RPC events']]);
    exit;
}

// Validate that the request came from Centrifugo.
$headers = array_change_key_case(getallheaders(), CASE_LOWER);
if ($headers['x-moodle-key'] !== $plugin->get_rpc_header()) {
    echo json_encode(['error' => ['code' => 401, 'message' => 'Authorisation failed']]);
    exit;
}

// Get input data.
$data = json_decode(file_get_contents('php://input'), true);
$component = (string)($data['data']['component'] ?? '');
$payload = $data['data']['payload'] ?? [];
$sesskey = $data['data']['sesskey'] ?? '';

// Get user information that was extracted from JWT and passed to the endpoint.
$userid = $data['user'];
$meta = $data['meta'] ?? [];

try {
    // Set current user.
    $user = $DB->get_record('user', ['id' => $userid, 'deleted' => '0'], '*', MUST_EXIST);
    $sessions = \core\session\manager::get_sessions_by_userid($userid);
    if (!$sessions) {
        // User no longer has an active session.
        echo json_encode(['error' => ['code' => 401, 'message' => 'Session expired']]);
        exit;
    }
    \core\session\manager::set_user($user);
    $_SESSION['USER']->sesskey = $sesskey;

    // Call component callback.
    $datatoreturn = manager::event_received($component, $payload);
    header('Content-Type: application/json; charset: utf-8');
    echo json_encode(['result' => ['data' => $datatoreturn]]);
} catch (\Throwable $t) {
    echo json_encode(['error' => ['code' => 500, 'message' => $t->getMessage()]]);
}
