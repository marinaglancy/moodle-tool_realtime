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

namespace tool_realtime\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use tool_realtime\channel;

/**
 * Web service to send test events for the test settings page
 *
 * @package    tool_realtime
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class send_test_events extends external_api {
    /**
     * Describes the parameters
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'count' => new external_value(PARAM_INT, 'Number of events to send'),
            'useadhoc' => new external_value(PARAM_BOOL, 'Whether to queue as ad-hoc task', VALUE_DEFAULT, false),
            'burstid' => new external_value(PARAM_ALPHANUMEXT, 'Unique identifier for this burst', VALUE_DEFAULT, ''),
            'delay' => new external_value(PARAM_INT, 'Delay between events in milliseconds', VALUE_DEFAULT, 0),
        ]);
    }

    /**
     * Send test events immediately or queue an ad-hoc task
     *
     * @param int $count
     * @param bool $useadhoc
     * @param string $burstid
     * @param int $delay Delay between events in milliseconds
     * @return array
     */
    public static function execute(int $count, bool $useadhoc = false, string $burstid = '', int $delay = 0): array {
        ['count' => $count, 'useadhoc' => $useadhoc, 'burstid' => $burstid, 'delay' => $delay] =
            self::validate_parameters(
                self::execute_parameters(),
                ['count' => $count, 'useadhoc' => $useadhoc, 'burstid' => $burstid, 'delay' => $delay]
            );

        $context = \context_system::instance();
        self::validate_context($context);
        require_capability('moodle/site:config', $context);

        if ($count < 1 || $count > 10000) {
            throw new \invalid_parameter_exception('Count must be between 1 and 10000');
        }
        if ($delay < 0 || $delay > 60000) {
            throw new \invalid_parameter_exception('Delay must be between 0 and 60000');
        }

        // Compute request start time for clock offset calibration.
        global $PERF;
        [$usec, $sec] = explode(' ', $PERF->starttime);
        $startms = (int)(((float)$sec + (float)$usec) * 1000);

        if ($useadhoc) {
            $task = new \tool_realtime\task\burst_test();
            $task->set_custom_data(['count' => $count, 'burstid' => $burstid, 'delay' => $delay,
                'scheduledtime' => time()]);
            \core\task\manager::queue_adhoc_task($task);
            // Return the midpoint of request start and now to split processing time evenly.
            $servertime = (int)(($startms + microtime(true) * 1000) / 2);
            return ['status' => true, 'servertime' => $servertime];
        }

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

        // Return the midpoint of request start and now to split processing time evenly.
        $servertime = (int)(($startms + microtime(true) * 1000) / 2);
        return ['status' => true, 'servertime' => $servertime];
    }

    /**
     * Describes the return value
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'status' => new external_value(PARAM_BOOL, 'Whether the operation was successful'),
            'servertime' => new external_value(PARAM_INT, 'Server midpoint timestamp in milliseconds', VALUE_DEFAULT, 0),
        ]);
    }
}
