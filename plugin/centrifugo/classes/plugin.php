<?php
// This file is part of realtimeplugin_centrifugo plugin
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

namespace realtimeplugin_centrifugo;

defined('MOODLE_INTERNAL') || die();

use tool_realtime\channel;
use tool_realtime\plugin_base;

require(__DIR__ . '/../vendor/autoload.php');

/**
 * Class plugin
 *
 * @package    realtimeplugin_centrifugo
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class plugin extends plugin_base {
    /** @var bool */
    protected static $initialised = false;

    #[\Override]
    public function is_set_up(): bool {
        return $this->get_websocket_url()
            && $this->get_api_key() !== ''
            && $this->get_token_secret() !== '';
    }

    /**
     * Get webcosket url from the settings
     *
     * @return string
     */
    protected function get_websocket_url(): string {
        $host = get_config('realtimeplugin_centrifugo', 'host');
        if (empty($host)) {
            return '';
        }
        $protocol = get_config('realtimeplugin_centrifugo', 'usessl') ? 'wss://' : 'ws://';
        return $protocol . $host . '/connection/websocket';
    }

    /**
     * Get API host from the settings (for requesting authentication tokens)
     *
     * @return string
     */
    protected function get_api_url(): string {
        $host = get_config('realtimeplugin_centrifugo', 'host');
        if (empty($host)) {
            return '';
        }
        $protocol = get_config('realtimeplugin_centrifugo', 'usessl') ? 'https://' : 'http://';
        return $protocol . $host . '/api';
    }

    /**
     * Get the HTTP API key for authenticating server-to-Centrifugo requests
     *
     * @return string
     */
    protected function get_api_key(): string {
        return (string) get_config('realtimeplugin_centrifugo', 'apikey');
    }

    /**
     * Get the HMAC secret for signing JWT connection tokens
     *
     * @return string
     */
    protected function get_token_secret(): string {
        return (string) get_config('realtimeplugin_centrifugo', 'tokensecret');
    }

    /**
     * Whether RPC is enabled and properly configured
     *
     * @return bool
     */
    public function use_rpc(): bool {
        return (bool) get_config('realtimeplugin_centrifugo', 'userpc')
            && $this->get_rpc_header() !== null;
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
        $host = $this->get_websocket_url();
        $token = $this->get_token();
        $PAGE->requires->js_call_amd(
            'realtimeplugin_centrifugo/realtime',
            'init',
            [['host' => $host, 'token' => $token, 'userpc' => $this->use_rpc()]]
        );
    }

    #[\Override]
    public function notify(channel $channel, array|null $payload = null): void {
        $channelname = $channel->get_hash();
        $client = new \phpcent\Client($this->get_api_url());
        $client->setApiKey($this->get_api_key());
        $client->publish($channelname, ['payload' => $payload ?? []]);
    }

    #[\Override]
    public function subscribe(channel $channel): void {
        global $PAGE;
        self::init();
        $PAGE->requires->js_call_amd(
            'realtimeplugin_centrifugo/realtime',
            'subscribe',
            [$channel->get_hash(), $channel->get_properties()]
        );
    }

    /**
     * Generate a JWT token for the current user
     *
     * @return string
     */
    public function get_token(): string {
        global $USER;
        $client = new \phpcent\Client($this->get_api_url());
        // Generate a JWT token for the current user that is valid for 5 minutes.
        $meta = [];
        $token = $client->setSecret($this->get_token_secret())->generateConnectionToken(
            $USER->id,
            time() + 5 * 60,
            [],
            [],
            $meta
        );
        return $token;
    }

    /**
     * Get the RPC webhook endpoint URL
     *
     * @return string
     */
    public function get_rpc_endpoint(): string {
        global $CFG;
        return $CFG->wwwroot . '/admin/tool/realtime/plugin/centrifugo/webhook-rpc.php';
    }

    /**
     * Get the expected authentication header value for RPC requests
     *
     * @return string|null
     */
    public function get_rpc_header(): ?string {
        $webhookkey = get_config('realtimeplugin_centrifugo', 'webhookkey');
        return !empty($webhookkey) ? $webhookkey : null;
    }
}
