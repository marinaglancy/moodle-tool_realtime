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

namespace realtimeplugin_pusher;

defined('MOODLE_INTERNAL') || die();

use tool_realtime\channel;
use tool_realtime\plugin_base;

require(__DIR__ . '/../vendor/autoload.php');

/**
 * Main class for realtimeplugin_pusher plugin
 *
 * @package    realtimeplugin_pusher
 * @copyright  2020 Daniel Conquit, Matthew Gray, Nicholas Parker, Dan Thistlethwaite
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class plugin extends plugin_base {

    /** @var bool */
    static protected $initialised = false;

    /**
     * Is the plugin setup completed
     *
     * @return bool
     */
    public function is_set_up(): bool {
        $appid = get_config('realtimeplugin_pusher', 'app_id');
        $key = get_config('realtimeplugin_pusher', 'key');
        $secret = get_config('realtimeplugin_pusher', 'secret');
        $cluster = get_config('realtimeplugin_pusher', 'cluster');
        return $appid && $key && $secret && $cluster;
    }

    /**
     * Subscribe the current page to receive notifications about events
     *
     * @param channel $channel
     */
    public function subscribe(channel $channel): void {
        self::init();
        global $PAGE, $USER;
        $PAGE->requires->js_call_amd('realtimeplugin_pusher/realtime', 'subscribe',
            [$channel->get_hash(), $channel->get_properties()]);
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
        $key = get_config('realtimeplugin_pusher', 'key');
        $cluster = get_config('realtimeplugin_pusher', 'cluster');
        self::$initialised = true;
        $PAGE->requires->js_call_amd('realtimeplugin_pusher/realtime',  'init',
            [$key, $cluster]);
    }

    /**
     * Notifies all subscribers about an event
     *
     * @param channel $channel
     * @param array|null $payload
     */
    public function notify(channel $channel, ?array $payload = null): void {
        $appid = get_config('realtimeplugin_pusher', 'app_id');
        $key = get_config('realtimeplugin_pusher', 'key');
        $secret = get_config('realtimeplugin_pusher', 'secret');
        $cluster = get_config('realtimeplugin_pusher', 'cluster');

        $options = [
            'cluster' => (string)($cluster),
            'useTLS' => true,
        ];
        $pusher = new \Pusher\Pusher(
            (string)($key),
            (string)($secret),
            (string)($appid),
            $options
        );

        $channelname = $channel->get_hash();
        $payloadjson = json_encode($payload ?? []);

        $pusher->trigger((string)$channelname, 'event', $payloadjson);
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
}
