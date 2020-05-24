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
 * Testing realtime in behat
 *
 * This is not an example of how to use polling! Polling is designed to send notifications to OTHER
 * sessions and other users. This is just a test that can be executed in single-threaded behat.
 *
 * @package    tool_realtime
 * @copyright  2020 Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__.'/../../../../../../config.php');

// Only continue for behat site.
defined('BEHAT_SITE_RUNNING') ||  die();

require_login(0, false);
$PAGE->set_url('/admin/tool/realtime/tests/behat/fixtures/realtime.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('admin');

if ($test = optional_param('test', 0, PARAM_INT)) {
    \tool_realtime\api::notify(context_user::instance($USER->id), 'tool_realtime', 'test', 0, ['data' => $test]);
    exit;
}

$pluginname = \tool_realtime\manager::get_enabled_plugin_name();
\tool_realtime\api::subscribe(context_user::instance($USER->id), 'tool_realtime', 'test', 0);
echo $OUTPUT->header();
$PAGE->requires->js_amd_inline(<<<EOL
    M.util.js_pending('initrealtimetest');
    require(['jquery', 'core/pubsub', 'tool_realtime/events'], function($, PubSub, RealTimeEvents) {
        $('body').on('click', '.testform', function(e) {
            e.preventDefault();
            var ajax = new XMLHttpRequest();
            ajax.open('GET', "{$PAGE->url}?test=" + $(e.currentTarget).data('linkid'), true);
            ajax.send();
        });

        PubSub.subscribe(RealTimeEvents.EVENT, function(event) {
            $('#realtimeresults').append('Received event for component ' + event.component +
            ', area = ' + event.area + ', itemid = ' + event.itemid +
            ', context id = ' + event.context.id +
            ', contextlevel = ' + event.context.contextlevel +
            ', context instanceid = ' + event.context.instanceid +
            ', payload data = ' + event.payload.data + "<br>");
        });

        $('#realtimeresults').append("Realtime plugin - {$pluginname}<br>");
        return M.util.js_complete('initrealtimetest');
    });
EOL
);

?>
<p><a class="testform" data-linkid="1" href="#">
    Test1
</a></p>
<p><a class="testform" data-linkid="2" href="#">
    Test2
</a></p>
<div id="realtimeresults">
</div>
<?php
echo $OUTPUT->footer();
