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
 * Endpoint for client-to-server push requests via the realtime API.
 *
 * @package    tool_realtime
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require('../../../config.php');

require_login();
require_sesskey();

$component = required_param('component', PARAM_COMPONENT);
$payload = required_param('payload', PARAM_RAW);
$payload = json_decode($payload, true);

$resp = \tool_realtime\manager::event_received($component, $payload);
echo json_encode(['success' => 1, 'response' => $resp]);
