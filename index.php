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
 *  A page for testing realtime event pushing form CL.
 *
 * @package    tool_realtime
 * @copyright  2020 Daniel Conquit, Matthew Gray, Nicholas Parker, Dan Thistlethwaite
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(__FILE__) . '/../../../config.php');
require_once($CFG->dirroot . '/lib/adminlib.php');
require "$CFG->libdir/tablelib.php";

//TODO: Make this page visible to any user so that user access permissions may be checked.

admin_externalpage_setup('tool_realtime_report');
// Instantiate realtime_tool_form.
$mform = new tool_realtime\form\realtime_tool_form();
$url = new moodle_url('/admin/tool/realtime/');
$PAGE->set_context(context_system::instance());
$PAGE->set_title(get_string('pluginname', 'tool_realtime'));
$PAGE->set_heading(get_string('pluginname', 'tool_realtime'));
echo $OUTPUT->header();

$action = optional_param('action', '', PARAM_ALPHA);

if(!isset($SESSION->channels) || $action == 'clearall') {
    $SESSION->channels = array();
}

if ($fromform = $mform->get_data()) {
    $channeltoappend = array(   "contextid" => $fromform->context,
                                "component" => $fromform->component,
                                "area" => $fromform->area,
                                "itemid" => $fromform->itemid);
    array_push($SESSION->channels, $channeltoappend);
}

for ($counter = 0; $counter < count($SESSION->channels); $counter++) {
    $contextfromform = context::instance_by_id($SESSION->channels[$counter]["contextid"]);
    tool_realtime\api::subscribe($contextfromform, $SESSION->channels[$counter]["component"], $SESSION->channels[$counter]["area"], $SESSION->channels[$counter]["itemid"]);
}

$mform->display();
echo $OUTPUT->heading(get_string('channeltable', 'tool_realtime'));

if (!empty($SESSION->channels) && count($SESSION->channels) > 0) {
    $table = new html_table();
    $table->attributes['class'] = 'generaltable';
    $table->head = array(
        get_string('context', 'tool_realtime'),
        get_string('component', 'tool_realtime'),
        get_string('area', 'tool_realtime'),
        get_string('itemid', 'tool_realtime'),
    );

    foreach ($SESSION->channels as $channel) {
        $row = array();
        $row[] = $channel['contextid'];
        $row[] = $channel['component'];
        $row[] = $channel['area'];
        $row[] = $channel['itemid'];

        $table->data[] = $row;
    }
    echo html_writer::table($table);
}

$clearurl = new moodle_url('/admin/tool/realtime/',  ['action' => 'clearall']);
echo $OUTPUT->single_button($clearurl, 'Clear all channels');

echo "<br>";
echo $OUTPUT->heading(get_string('eventtesting', 'tool_realtime'));
echo "<div id='testarea'></div>";
echo $OUTPUT->footer();
?>

<script type="text/javascript">
    require(['core/pubsub', 'tool_realtime/events', 'tool_realtime/api'], function(PubSub, RealTimeEvents, api) {

        PubSub.subscribe(RealTimeEvents.EVENT, function(data) {
            let testArea = document.getElementById('testarea');
            testArea.appendChild(document.createElement("br"));
            let headingForEvent = document.createElement('div');
            headingForEvent.setAttribute('id', 'eventHeading');
            headingForEvent.style.fontWeight = 'bold';
            testArea.appendChild(headingForEvent);
            let eventReceivedText = document.createTextNode("Event received:");
            let eventReceived = new Date().getTime();
            let itemID = document.createTextNode("ID:    " + data['itemid']);
            let area = document.createTextNode("Component:    " + data['area']);
            let component = document.createTextNode("Area:    " + data['component']);
            let payloadtext = document.createTextNode("Payload: ");
            headingForEvent.appendChild(eventReceivedText);
            testArea.appendChild(document.createElement("br"));
            testArea.appendChild(itemID);
            testArea.appendChild(document.createElement("br"));
            testArea.appendChild(area);
            testArea.appendChild(document.createElement("br"));
            testArea.appendChild(component);
            testArea.appendChild(document.createElement("br"));
            testArea.appendChild(payloadtext);
            testArea.appendChild(document.createElement("br"));

            for (let key in data['payload']) {
                if (key !== 'eventReceived') {
                    testArea.appendChild(document.createTextNode(key + " => " + data['payload'][key]));
                    testArea.appendChild(document.createElement("br"));
                }
            }

            testArea.appendChild(document.createTextNode("Latency is: " +
                (eventReceived - parseInt(data['payload']['eventReceived'])) + " milliseconds"));
            testArea.appendChild(document.createElement("br"));
        });
    });
</script>


