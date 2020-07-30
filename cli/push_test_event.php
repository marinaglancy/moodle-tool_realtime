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
 * @package    core
 * @subpackage cli
 * @copyright  2020 Daniel Conquit, Matthew Gray, Nicholas Parker, Dan Thistlewaite
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
    'help' => false,
    'verbose' => false
];

$shortmappings = [
    'c' => 'context',
    'n' => 'component',
    'a' => 'area',
    'i' => 'id',
    'p' => 'payload',
    'h' => 'help',
    'v' => 'verbose'
];

// Get CLI params.
list($options, $unrecognized) = cli_get_params($longparams, $shortmappings);

if ($unrecognized) {
    $unrecognized = implode("\n  ", $unrecognized);
    cli_error(get_string('cliunknowoption', 'admin', $unrecognized));
}

if ($options['help']) {
    echo
    "Send
By default all themes will be recompiled unless otherwise specified.
Options:
-c, --context       type of event to be sent
-n, --component     identification number for event
-a, --area          area related to event
-i, --id            event ID
-p, --payload       payload array for event
-v, --verbose       Print info comments to stdout
-h, --help          Print out this help
Example:

\$ sudo -u www-data var/www/html/moodle/admin/tool/realtime/cli/push_test_event.php --context=3 --component=testcomponent --area=testarea --id=123 --payload='testkey1=>testvalue1,testkey2=>testvalue2'
";
    die;
}

cli_heading('Push Test Event');

if (!is_null($options['context'])) {
    $user_id = [$options['context']];
    $context = context_user::instance($user_id[0]);
}
if (!is_null($options['component'])) {
    $component = [$options['component']][0];
}
if (!is_null($options['area'])) {
    $area = [$options['area']][0];
}
if (!is_null($options['id'])) {
    $id = [$options['id']][0];
}

// Create payload array
if (!is_null($options['payload'])) {
    $payloadUnprocessed = [$options['payload']][0];
    $payloadCommaSeperated = explode(",", $payloadUnprocessed);
    $payload = array();
    for ($i = 0; $i < count($payloadCommaSeperated); $i++) {
        $payloadKeySeperated = explode("=>", $payloadCommaSeperated[$i]);
        $payload[$payloadKeySeperated[0]] = $payloadKeySeperated[1];
    }
} else {
    $payload = array("Brand" => "Volvo", "Model" => "Fam Van");
}
// Append server time before sending
$payload["eventReceived"] = microtime(true)*1000;

\tool_realtime\api::notify($context, $component, $area, $id, $payload);
exit(0);
