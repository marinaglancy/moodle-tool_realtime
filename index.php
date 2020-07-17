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
 * @copyright  2020 Daniel Conquit, Matthew Gray, Nicholas Parker, Dan Thistlewaite
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(__FILE__) . '/../../../config.php');
require_once($CFG->dirroot . '/lib/adminlib.php');
require_once(dirname(__FILE__) . '/plugin/phppoll/classes/realtime_tool_form.php');


// Instantiate realtime_tool_form.
$mform = new realtime_tool_form();

$url = new moodle_url('/admin/tool/realtime/');
admin_externalpage_setup('tool_realtime_report');
$PAGE->set_context(context_system::instance());
$PAGE->set_title(get_string('pluginname', 'tool_realtime'));
$PAGE->set_heading(get_string('pluginname', 'tool_realtime'));
$context = context_system::instance();
$component = "thiscomponent";
$component2 = "thatcomponent";
$area = "pingtest";
$area2 = "pongtest";
$itemid = 1;
$itemid2 = 2;
\tool_realtime\api::subscribe($context, $component, $area, $itemid);
\tool_realtime\api::subscribe($context, $component2, $area2, $itemid2);
echo $OUTPUT->header();
$mform->display();

if ($mform->no_submit_button_pressed()) {
    echo 'testlol';
}
echo $OUTPUT->heading(get_string('eventtesting', 'tool_realtime'));
Echo
"<div id='testarea'></div>";
echo $OUTPUT->footer();
?>

<script type="text/javascript">
    require(['core/pubsub', 'tool_realtime/events'], function(PubSub, RealTimeEvents) {
        PubSub.subscribe(RealTimeEvents.EVENT, function(data) {
            console.log(data);
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

