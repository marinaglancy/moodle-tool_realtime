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
 * Class realtimeplugin_pusher\plugin
 *
 * @package     realtimeplugin_pusher
 * @copyright  2020 Daniel Conquit, Matthew Gray, Nicholas Parker, Dan Thistlewaite
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace realtimeplugin_pusher;

defined('MOODLE_INTERNAL') || die();

use tool_realtime\plugin_base;

<<<<<<< HEAD
require(__DIR__ . '/../../../../../../vendor/autoload.php');
=======
require __DIR__ . '/../../../../../../vendor/autoload.php';
>>>>>>> 9e4aa77... Pusher Plugin

/**
 * Class realtimeplugin_pusher\plugin
 *
 * @package     realtimeplugin_pusher
 * @copyright  2020 Daniel Conquit, Matthew Gray, Nicholas Parker, Dan Thistlewaite
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
<<<<<<< HEAD
        $appid = get_config('realtimeplugin_pusher', 'app_id');
=======
        $app_id = get_config('realtimeplugin_pusher', 'app_id');
>>>>>>> 9e4aa77... Pusher Plugin
        $key = get_config('realtimeplugin_pusher', 'key');
        $secret = get_config('realtimeplugin_pusher', 'secret');
        $cluster = get_config('realtimeplugin_pusher', 'cluster');

        // TODO check that area is defined only as letters and numbers.
        global $PAGE, $USER;
<<<<<<< HEAD
        $PAGE->requires->js_call_amd('realtimeplugin_pusher/realtime', 'init',
            [$USER->id, $context->id, $component, $area, $itemid, $appid, $key, $secret, $cluster]);
=======
//        $url = new \moodle_url('https://js.pusher.com/7.0/pusher.min.js');
//
//        $PAGE->requires->js_module($url, true);
        $PAGE->requires->js_call_amd('realtimeplugin_pusher/realtime', 'init',
            [$USER->id, $context->id, $component, $area, $itemid, $app_id, $key, $secret, $cluster]);
>>>>>>> 9e4aa77... Pusher Plugin
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
<<<<<<< HEAD
        $appid = get_config('realtimeplugin_pusher', 'app_id');
=======
        $app_id = get_config('realtimeplugin_pusher', 'app_id');
>>>>>>> 9e4aa77... Pusher Plugin
        $key = get_config('realtimeplugin_pusher', 'key');
        $secret = get_config('realtimeplugin_pusher', 'secret');
        $cluster = get_config('realtimeplugin_pusher', 'cluster');

        $options = array(
            'cluster' => (string)($cluster),
            'useTLS' => true
        );
        $pusher = new \Pusher\Pusher(
            (string)($key),
            (string)($secret),
<<<<<<< HEAD
            (string)($appid),
            $options
        );

        $channelname = (string)($context->id) . '-' . (string)($component) . '-' . (string)($area) . '-' . (string)($itemid);
        $payloadjson = json_encode($payload ?? []);

        $pusher->trigger((string)$channelname, 'event', $payloadjson);
=======
            (string)($app_id),
            $options
        );

        $channel_name = (string)($context->id) . '-' . (string)($component) . '-' . (string)($area) . '-' . (string)($itemid);
        $payloadJSON = json_encode($payload ?? []);

        $pusher->trigger((string)$channel_name, 'event', $payloadJSON);
>>>>>>> 9e4aa77... Pusher Plugin
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