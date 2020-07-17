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
 * @copyright  2020 Nicholas Parker <ncpark3r@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../../config.php');
require_once("$CFG->libdir/clilib.php");
require_once("$CFG->libdir/outputlib.php");

$longparams = [
    'type' => null,
    'id' => null,
    'payload' => null,
    'help' => false,
    'verbose' => false
];

$shortmappings = [
    't' => 'type',
    'id' => 'id',
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
-t, --type      type of event to be sent
-id, --id       identification number for event
-v, --verbose   Print info comments to stdout
-h, --help      Print out this help
Example:

\$ sudo -u www-data var/www/html/moodle/admin/tool/realtime/cli/push_test_event.php --type=chatmessage --id=1337
";
    die;
}

if (empty($options['verbose'])) {
    $trace = new null_progress_trace();
} else {
    $trace = new text_progress_trace();
}

cli_heading('Push Test Event');

$contexttest = context_user::instance(3);
$componenttest = "testcomponent";
$areatest = "testarea";
$itemidtest = 123;
$payload = array("Volvo", "BMW", "Toyota");
\tool_realtime\api::notify($contexttest, $componenttest, $areatest, $itemidtest, $payload);

exit(0);
