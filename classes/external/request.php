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

use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_api;
use core_external\external_value;

/**
 * Implementation of web service tool_realtime_request
 *
 * @package    tool_realtime
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class request extends external_api {
    /**
     * Describes the parameters for tool_realtime_request
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'channel' => new external_value(PARAM_RAW, 'Channel properties'),
            'payload' => new external_value(PARAM_RAW, 'Payload'),
        ]);
    }

    /**
     * Implementation of web service realtimeplugin_centrifugo_request
     *
     * @param string $channelproperties
     * @param string $payload
     */
    public static function execute($channelproperties, $payload) {
        // Parameter validation.
        ['channel' => $channelproperties, 'payload' => $payload] = self::validate_parameters(
            self::execute_parameters(),
            ['channel' => $channelproperties, 'payload' => $payload]
        );

        $channelproperties = json_decode($channelproperties, true);
        $payload = json_decode($payload, true);

        $channel = \tool_realtime\channel::create_from_properties($channelproperties);
        $component = $channel->get_properties()['component'];
        $res = component_callback($component, 'realtime_event_received', [$channel, $payload]);
        if ($res && !is_array($res)) {
            throw new \coding_exception('Callback ' . $component . '_realtime_event_received returned value with an invalid type');
        }
        return ['response' => json_encode($res)];
    }

    /**
     * Describe the return structure for tool_realtime_request
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'response' => new external_value(PARAM_RAW, 'JSON-encoded response from the component callback'),
        ]);
    }
}
