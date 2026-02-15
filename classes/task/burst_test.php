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

namespace tool_realtime\task;

use tool_realtime\channel;

/**
 * Ad-hoc task that pushes a burst of test events
 *
 * @package    tool_realtime
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class burst_test extends \core\task\adhoc_task {
    /**
     * Get task name
     *
     * @return string
     */
    public function get_name(): string {
        return get_string('task_burst_test', 'tool_realtime');
    }

    /**
     * Execute the task - push N test events to the test channel
     */
    public function execute(): void {
        $data = $this->get_custom_data();
        $count = (int)$data->count;
        $burstid = $data->burstid ?? '';
        $delay = (int)($data->delay ?? 0);
        $scheduledtime = (int)($data->scheduledtime ?? 0);

        // Abort if the task is too old — the client is no longer listening.
        if ($scheduledtime > 0 && (time() - $scheduledtime) > 30) {
            mtrace("Burst test task skipped: scheduled " . (time() - $scheduledtime) . "s ago (limit 30s).");
            return;
        }

        // Often executed after changing settings. Make sure they are not cached.
        \cache::make('core', 'config')->delete('tool_realtime');

        $context = \context_system::instance();
        $channel = new channel($context, 'tool_realtime', 'test', 0);

        for ($i = 0; $i < $count; $i++) {
            if ($i > 0 && $delay > 0) {
                usleep($delay * 1000);
            }
            $channel->notify([
                'senttime' => (int)(microtime(true) * 1000),
                'seq' => $i,
                'total' => $count,
                'burstid' => $burstid,
            ]);
        }
    }
}
