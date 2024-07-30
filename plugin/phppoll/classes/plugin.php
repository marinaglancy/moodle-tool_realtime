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
 * Class realtimeplugin_phppoll\plugin
 *
 * @package     realtimeplugin_phppoll
 * @copyright   2020 Marina Glancy
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace realtimeplugin_phppoll;

defined('MOODLE_INTERNAL') || die();

use tool_realtime\plugin_base;

/**
 * Class realtimeplugin_phppoll\plugin
 *
 * @package     realtimeplugin_phppoll
 * @copyright   2020 Marina Glancy
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class plugin extends plugin_base {

    /** @var bool */
    static protected $initialised = false;
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
     * @param \context $context
     * @param string $component
     * @param string $area
     * @param int $itemid
     */
    public function subscribe(\context $context, string $component, string $area, int $itemid): void {
        // TODO check that area is defined only as letters and numbers.
        global $PAGE, $USER, $DB;
        if (!$this->is_set_up() || !isloggedin() || isguestuser()) {
            return;
        }
        self::init();
        $fromid = (int)$DB->get_field_sql("SELECT max(id) FROM {" . self::TABLENAME .
            "} WHERE contextid = ?", [$context->id]);
        $fromtimestamp = microtime(true);
        $url = new \moodle_url('/admin/tool/realtime/plugin/phppoll/poll.php');
        $PAGE->requires->js_call_amd('realtimeplugin_phppoll/realtime', 'subscribe',
            [ $context->id, $component, $area, $itemid, $fromid, $fromtimestamp]);
    }

    /**
     * Intitialises realtime tool for Javascript subscriptions
     *
     */
    public function init(): void {
        // TODO check that area is defined only as letters and numbers.
        global $PAGE, $USER, $DB;
        if (!$this->is_set_up() || !isloggedin() || isguestuser() || self::$initialised) {
            return;
        }
        self::$initialised = true;
        $url = new \moodle_url('/admin/tool/realtime/plugin/phppoll/poll.php');
        $PAGE->requires->js_call_amd('realtimeplugin_phppoll/realtime',  'init',
            [$USER->id, self::get_token(), $url->out(false),
                $this->get_delay_between_checks()]);
    }

    /**
     * Notifies all subscribers about an event
     *
     * @param \context $context
     * @param string $component
     * @param string $area
     * @param int $itemid
     * @param array|null $payload
     */
    public function notify(\context $context, string $component, string $area, int $itemid, ?array $payload = null): void {
        global $DB;
        $time = time();
        $DB->insert_record(self::TABLENAME, [
            'contextid' => $context->id,
            'component' => $component,
            'area' => $area,
            'itemid' => $itemid,
            'payload' => json_encode($payload ?? []),
            'timecreated' => $time,
            'timemodified' => $time,
        ]);
    }

    /**
     * Get token for current user and current session
     *
     * @return string
     */
    public static function get_token() {
        global $USER;
        $sid = session_id();
        return self::get_token_for_user($USER->id, $sid);
    }

    /**
     * Get token for a given user and given session
     *
     * @param int $userid
     * @param string $sid
     * @return false|string
     */
    protected static function get_token_for_user(int $userid, string $sid) {
        return substr(md5($sid . '/' . $userid . '/' . get_site_identifier()), 0, 10);
    }

    /**
     * Validate that a token corresponds to one of the users open sessions
     *
     * @param int $userid
     * @param string $token
     * @return bool
     */
    public static function validate_token(int $userid, string $token) {
        global $DB;
        $sessions = $DB->get_records('sessions', ['userid' => $userid]);
        foreach ($sessions as $session) {
            if (self::get_token_for_user($userid, $session->sid) === $token) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get all notifications for a given user
     *
     * @param int $contextidentifier
     * @param int $fromid
     * @param string $component
     * @param string $area
     * @param int $itemid
     * @param float $fromtimestamp
     * @return array
     */
    public function get_all(int $contextidentifier,
                            int $fromid, string $component,
                            string $area, int $itemid,
                            float $fromtimestamp): array {
        global $DB;
        $events = [];
        $fromtimestampseconds = floor($fromtimestamp / 1000);
        if ($fromid == 0) {
            $events = $DB->get_records_select(self::TABLENAME,
                'contextid = :contextid
               AND timecreated > :fromtimestamp
               AND component = :component
               AND area = :area
               AND itemid = :itemid',
                [
                    'contextid' => $contextidentifier,
                    'fromid' => $fromid,
                    'component' => $component,
                    'area' => $area,
                    'itemid' => $itemid,
                    'fromtimestamp' => $fromtimestampseconds,
                ],
                'id', 'id, contextid, component, area, itemid, payload');
        } else {
            $events = $DB->get_records_select(self::TABLENAME,
                'contextid = :contextid
               AND id > :fromid
               AND component = :component
               AND area = :area
               AND itemid = :itemid',
                [
                    'contextid' => $contextidentifier,
                    'fromid' => $fromid,
                    'component' => $component,
                    'area' => $area,
                    'itemid' => $itemid,
                ],
                'id', 'id, contextid, component, area, itemid, payload');
        }

        array_walk($events, function(&$item) {
            $item->payload = @json_decode($item->payload, true);
            $context = \context::instance_by_id($item->contextid);
            $item->context = ['id' => $context->id, 'contextlevel' => $context->contextlevel,
                'instanceid' => $context->instanceid];
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
