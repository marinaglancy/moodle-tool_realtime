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
    'context' => null,
    'component' => null,
    'area' => null,
    'id' => null,
    'payload' => null,
    'help' => false
];

$shortmappings = [
    'c' => 'context',
    'n' => 'component',
    'a' => 'area',
    'i' => 'id',
    'p' => 'payload',
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
    "This CLI creates a new event with specific context and allows testing of the realtime tool
Options:
-c, --context       context for events
-n, --component     component events relate to
-a, --area          area related to event
-i, --itemid            event ID
-p, --payload       payload json for event
-h, --help          Print out this help
Example:

\$ php admin/tool/realtime/cli/push_test_event.php --context=3\
        --component=thiscomponent --area=pingtest --id=123 --payload='{\"testkey1\":\"testvalue1\",\"testkey2\":\"testvalue2\"}'\n";
    die;
}

cli_heading('Push Test Event');

if (!is_null($options['context'])) {
    $contextid = [$options['context']];
    $context = \context::instance_by_id($contextid[0]);
} else {
    $context = context_system::instance();
}
if (!is_null($options['component'])) {
    $component = [$options['component']][0];
} else {
    $component = 'moodle';
}
if (!is_null($options['area'])) {
    $area = [$options['area']][0];
} else {
    cli_error("Missing arg: area\nAdd -h for help");
}
if (!is_null($options['id'])) {
    $id = [$options['id']][0];
} else {
    cli_error("Missing arg: id\nAdd -h for help");
}

// Create payload array.
if (!is_null($options['payload'])) {
    $payload = json_decode([$options['payload']][0], true);
} else {
    cli_error("Missing arg: payload\nAdd -h for help");
}
// Append server time before sending.
$payload["eventReceived"] = microtime(true) * 1000;


\tool_realtime\api::notify($context, $component, $area, $id, $payload);

