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
     * Constructor
     *
     * @param \context $context
     * @param string $component
     * @param string $area
     * @param int $itemid
     * @param string $channeldetails any additional description of the communication channel, for example,
     *    conversation identifier or md5 of several properties.
     */
    public function __construct(context $context, string $component, string $area, int $itemid = 0, string $channeldetails = '') {
        // TODO validate parameters (clean_param, length, etc).
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
        if (manager::is_enabled($this->component, $this->area) && ($plugin = manager::get_plugin())) {
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
        if (manager::is_enabled($this->component, $this->area) && ($plugin = manager::get_plugin())) {
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
            'component' => (string)$this->component,
            'area' => (string)$this->area,
            'itemid' => (string)$this->itemid,
            'channeldetails' => (string)$this->channeldetails,
            'siteidentifier' => get_site_identifier(),
        ];
        return md5(json_encode($params));
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
}
