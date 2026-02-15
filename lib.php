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
 * Callbacks for tool_realtime
 *
 * @package    tool_realtime
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Handles events received from the client via the sendToServer API
 *
 * Used by the test settings page to test the browser-to-server communication path.
 *
 * @param array $payload
 * @return array
 */
function tool_realtime_realtime_event_received($payload) {
    require_capability('moodle/site:config', context_system::instance());
    return [
        'receivedtime' => (int)(microtime(true) * 1000),
        'echo' => $payload,
    ];
}
