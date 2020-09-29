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
 * Send events to event testing page
 *
 * @package    tool_realtime
 * @subpackage cli
 * @copyright  2020 Daniel Conquit, Matthew Gray, Nicholas Parker, Dan Thistlethwaite
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../../config.php');
require_once("$CFG->libdir/clilib.php");
require_once("$CFG->libdir/outputlib.php");

$longparams = [
    'eventcount' => null,
    'help' => false
];

$shortmappings = [
    'ec' => 'eventcount',
    'h' => 'help'
];

// Get CLI params.
list($options, $unrecognized) = cli_get_params($longparams, $shortmappings);

if ($unrecognized) {
    $unrecognized = implode("\n  ", $unrecognized);
    cli_error(get_string('cliunknowoption', 'admin', $unrecognized));
}

if ($options['help']) {
    echo
    "This CLI load tests the realtime tool
Options:
-ec, --eventcount       number of events to send

Example:

\$ php admin/tool/realtime/cli/push_test_event.php --eventcount=3\n";
    die;
}

cli_heading('Push Test Event');

if (!is_null($options['eventcount'])) {
    $eventcount = intval($options['eventcount']);
} else {
    cli_error("Missing arg: id\nAdd -h for help");
}

// Create context
$context = \context::instance_by_id(1);

for ($counter = 0; $counter < $eventcount; $counter++) {
    $payload["eventReceived"] = microtime(true) * 1000;
    \tool_realtime\api::notify($context, 'loadtest', 'loadtest', 1, $payload);
}


