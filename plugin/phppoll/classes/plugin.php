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

namespace realtimeplugin_phppoll;

use tool_realtime\channel;
use tool_realtime\plugin_base;

/**
 * Main class for the realtimeplugin_phppoll plugin
 *
 * @package     realtimeplugin_phppoll
 * @copyright   2020 Marina Glancy
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class plugin extends plugin_base {
    /** @var bool */
    protected static $initialised = false;
    /** @var string */
    const TABLENAME = 'realtimeplugin_phppoll';

    /**
     * Is the plugin setup completed
     *
     * @return bool
     */
    public function is_set_up(): bool {
        return true;
    }

    /**
     * Subscribe the current page to receive notifications about events
     *
     * @param channel $channel
     */
    public function subscribe(channel $channel): void {
        global $PAGE, $USER, $DB;
        if (!$this->is_set_up() || !isloggedin() || isguestuser()) {
            return;
        }
        self::init();
        $fromid = (int)$DB->get_field_sql("SELECT max(id) FROM {" . self::TABLENAME . "}");
        $hash = $channel->get_hash();
        // Create a user key to be used with this channel for this user id (use userid as an instance).
        $key = create_user_key("realtimeplugin_phppoll:$hash", $USER->id, $USER->id);

        $PAGE->requires->js_call_amd(
            'realtimeplugin_phppoll/realtime',
            'subscribe',
            [$hash, $key, $fromid]
        );
    }

    /**
     * Intitialises realtime tool for Javascript subscriptions
     *
     */
    public function init(): void {
        global $PAGE, $USER, $DB;
        if (!$this->is_set_up() || !isloggedin() || isguestuser() || self::$initialised) {
            return;
        }
        self::$initialised = true;
        $url = new \moodle_url('/admin/tool/realtime/plugin/phppoll/poll.php');
        $PAGE->requires->js_call_amd(
            'realtimeplugin_phppoll/realtime',
            'init',
            [$USER->id, $url->out(false), $this->get_delay_between_checks(), substr(session_id(), 0, 5)]
        );
    }

    /**
     * Notifies all subscribers about an event
     *
     * @param channel $channel
     * @param array|null $payload
     */
    public function notify(channel $channel, ?array $payload = null): void {
        global $DB;
        $time = time();
        $DB->insert_record(self::TABLENAME, [
            'hash' => $channel->get_hash(),
            'payload' => json_encode($payload ?? []),
            'timecreated' => $time,
            'timemodified' => $time,
        ] + $channel->get_properties());
    }

    /**
     * Get all notifications for a given user
     *
     * @param array $hashes List of all channel hashes we want to collect events from
     * @param int $fromid id in the 'realtimeplugin_phppoll' at which we already received events in the previous cycles
     * @return array
     */
    public function get_all(array $hashes, int $fromid): array {
        global $DB;
        $events = [];

        [$sql, $params] = $DB->get_in_or_equal($hashes, SQL_PARAMS_NAMED);
        $sql .= $fromid ? ' AND id > :fromid' : '';
        $params['fromid'] = $fromid;
        $events = $DB->get_records_select(
            self::TABLENAME,
            "hash $sql",
            $params,
            'id',
            'id, contextid, component, area, itemid, channeldetails, payload'
        );

        array_walk($events, function (&$item) {
            $item->payload = @json_decode($item->payload, true);
            try {
                $context = \context::instance_by_id($item->contextid);
                $item->context = ['id' => $context->id, 'contextlevel' => $context->contextlevel,
                    'instanceid' => $context->instanceid];
            } catch (\moodle_exception $e) {
                $item->context = ['id' => $context->id];
            }
            unset($item->contextid);
        });
        return $events;
    }

    /**
     * Delay between checks (or between short poll requests), ms
     *
     * @return int sleep time between checks, in milliseconds
     */
    public function get_delay_between_checks(): int {
        $period = get_config('realtimeplugin_phppoll', 'checkinterval');
        return max($period, 200);
    }

    /**
     * Maximum duration for poll requests
     *
     * @return int time in seconds
     */
    public function get_request_timeout(): float {
        $duration = get_config('realtimeplugin_phppoll', 'requesttimeout');
        return (isset($duration) && $duration !== false) ? (float)$duration : 30;
    }
}
