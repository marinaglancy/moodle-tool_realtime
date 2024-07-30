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

admin_externalpage_setup('tool_realtime_report');
// Instantiate realtime_tool_form.
$mform = new tool_realtime\form\realtime_tool_form();
$url = new moodle_url('/admin/tool/realtime/');
$PAGE->set_context(context_system::instance());
$PAGE->set_title(get_string('loadtest', 'tool_realtime'));
$PAGE->set_heading(get_string('loadtest', 'tool_realtime'));
echo $OUTPUT->header();
$context = context::instance_by_id(1);
tool_realtime\api::subscribe($context, 'loadtest', 'loadtest', 1);

echo $OUTPUT->heading(get_string('eventtesting', 'tool_realtime'));
Echo
"<div id='testarea'></div>";
echo $OUTPUT->footer();
?>

<script type="text/javascript">
    require(['core/pubsub', 'tool_realtime/events', 'tool_realtime/api'], function(PubSub, RealTimeEvents, api) {
        var eventcounter = 0;
        var latency = 0;
        var averagelatency = 0;
        function tableCreate() {
            var body = document.getElementById('testarea');
            var tbl = document.createElement('table');
            tbl.setAttribute('id', 'table1');
            tbl.style.width = '100%';
            tbl.setAttribute('border', '1');
            tbl.style.textAlign = "center";
            var tbdy = document.createElement('tbody');
            for (var i = 0; i < 2; i++) {
                var tr = document.createElement('tr');
                for (var j = 0; j < 2; j++) {
                    var td = document.createElement('td');
                    if(i == 0 && j == 0) {
                        td.appendChild(document.createTextNode('Event Count'));
                    } else if (i == 0 && j == 1) {
                        td.appendChild(document.createTextNode('Average Latency'));
                    } else if (i == 1 && j == 0) {
                        td.appendChild(document.createTextNode(eventcounter));
                    } else if (i == 1 && j == 1) {
                        td.appendChild(document.createTextNode(averagelatency));
                    }
                    tr.appendChild(td)
                }
                tbdy.appendChild(tr);
            }
            tbl.appendChild(tbdy);
            body.appendChild(tbl)
        }
        tableCreate();

        function updateTable() {
            var body = document.getElementById('testarea');
            body.innerHTML = "";
            tableCreate();
        }

        function calculateLatency() {
            averagelatency = latency / eventcounter;
        }

        setInterval(function(){ updateTable() }, 3000);

        PubSub.subscribe(RealTimeEvents.EVENT, function(data) {
            eventcounter++;
            latency += new Date().getTime() - data['payload']['eventReceived'];
            calculateLatency();
        });
    });
</script>


