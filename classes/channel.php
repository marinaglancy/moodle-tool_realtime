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

namespace tool_realtime;

use context;

/**
 * Allows to notify and subscribe to the events in the channel between client and server
 *
 * Depending on the enabled plugin the communication will be performed by polling
 * from server or using websockets
 *
 * @package    tool_realtime
 * @copyright  2024 Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class channel {
    /** @var context */
    protected $context = null;
    /** @var string */
    protected $component = '';
    /** @var string */
    protected $area = '';
    /** @var int */
    protected $itemid = 0;
    /** @var string */
    protected $channeldetails = '';

    /**
     * Creates a channel for server-to-client real-time notifications.
     *
     * A channel uniquely identifies a communication path between server and client.
     * A hash is derived from all channel properties and embedded in the page
     * during subscription. JavaScript uses this hash to authenticate polling or
     * websocket requests — users cannot guess the hash of another channel.
     *
     * Creating a new channel with the same properties always produces the same hash,
     * so the same channel object can be used for both subscribing and notifying.
     * To prevent reuse of a channel across time periods (e.g. next day/next year),
     * include a time-bound value in $channeldetails.
     *
     * @param \context $context Moodle context (e.g. course module context)
     * @param string $component Frankenstyle plugin name (e.g. 'mod_kahoodle')
     * @param string $area Identifies the communication area within the plugin (e.g. 'game')
     * @param int $itemid Integer identifier, often used to target specific users (0 for broadcast)
     * @param string $channeldetails Optional extra identifier, e.g. a conversation ID
     *     or json_encode of multiple properties
     */
    public function __construct(context $context, string $component, string $area, int $itemid = 0, string $channeldetails = '') {
        $this->context = $context;
        $this->component = $component;
        $this->area = $area;
        $this->itemid = $itemid;
        $this->channeldetails = $channeldetails;
    }

    /**
     * Subscribes to notifications in the channel
     *
     * This function must be called in PHP when a page is rendered.
     * On the page itself in the JS the plugin needs to listen to the PubSub event, see README for examples.
     *
     * @return void
     */
    public function subscribe(): void {
        if (manager::is_enabled($this->component) && ($plugin = manager::get_plugin())) {
            $plugin->subscribe($this);
        }
    }

    /**
     * Notifies all subscribers about an event
     *
     * @param array|null $payload
     * @return void
     */
    public function notify(?array $payload = null): void {
        if (manager::is_enabled($this->component) && ($plugin = manager::get_plugin())) {
            $plugin->notify($this, $payload);
        }
    }

    /**
     * Helper function creating a unique hash for the channel arguments
     *
     * @return string
     */
    public function get_hash() {
        $params = ['contextid' => (string)$this->context->id,
            'component' => $this->component,
            'area' => $this->area,
            'itemid' => (string)$this->itemid,
            'channeldetails' => (string)$this->channeldetails,
            'siteurl' => (new \moodle_url('/'))->out(false),
            'salt' => self::get_salt(),
        ];
        return substr(hash('sha256', json_encode($params)), 0, 32);
    }

    /**
     * Returns the random salt used for channel hashing, generating one if it doesn't exist yet.
     *
     * @return string
     */
    protected static function get_salt(): string {
        $salt = get_config('tool_realtime', 'channelsalt');
        if (empty($salt)) {
            $salt = random_bytes(32);
            $salt = bin2hex($salt);
            set_config('channelsalt', $salt, 'tool_realtime');
        }
        return $salt;
    }

    /**
     * Properties of the channel
     *
     * @return array
     */
    public function get_properties() {
        return ['contextid' => $this->context->id,
            'component' => $this->component,
            'area' => $this->area,
            'itemid' => $this->itemid,
            'channeldetails' => $this->channeldetails];
    }

    /**
     * Create channel from properties
     *
     * @param array $properties
     * @return self
     */
    public static function create_from_properties(array $properties) {
        $context = context::instance_by_id(clean_param($properties['contextid'], PARAM_INT));
        return new self(
            $context,
            $properties['component'],
            $properties['area'],
            clean_param($properties['itemid'], PARAM_INT),
            $properties['channeldetails'] ?? '',
        );
    }
}
