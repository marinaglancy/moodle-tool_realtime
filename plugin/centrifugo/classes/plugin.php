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
    /** @var int Seconds a generated token stays valid */
    public const TOKEN_LIFETIME = 5 * 60;

    /** @var string Session key listing the channels the user may subscribe to */
    private const SESSION_CHANNELS_KEY = 'tool_realtime_centrifugo_channels';

    /** @var int Seconds a channel authorisation is remembered for */
    private const CHANNEL_LIFETIME = HOURSECS;

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
     * Intitialises realtime tool for Javascript subscriptions
     *
     */
    public function init(): void {
        global $PAGE, $USER, $DB;
        if (self::$initialised || !$this->is_set_up() || !isloggedin() || (isguestuser() && !$this->allow_guests())) {
            return;
        }
        self::$initialised = true;
        $host = $this->get_websocket_url();
        $token = $this->get_token();
        $PAGE->requires->js_call_amd(
            'realtimeplugin_centrifugo/realtime',
            'init',
            [['host' => $host, 'token' => $token]]
        );
    }

    #[\Override]
    public function notify(channel $channel, ?array $payload = null): void {
        $channelname = $channel->get_hash();
        $client = new \phpcent\Client($this->get_api_url());
        $client->setApiKey($this->get_api_key());
        $client->publish($channelname, ['payload' => $payload ?? []]);
    }

    #[\Override]
    public function subscribe(channel $channel): void {
        global $PAGE;
        self::init();
        $channelhash = $channel->get_hash();
        self::remember_channel($channelhash);
        $PAGE->requires->js_call_amd(
            'realtimeplugin_centrifugo/realtime',
            'subscribe',
            [$channelhash, $channel->get_properties(), $this->get_subscription_token($channelhash)]
        );
    }

    /**
     * Generate a subscription JWT token for the given channel.
     *
     * Only channels authorised in this session get a token, otherwise any user could request one
     * for an arbitrary channel and channel_token_auth would be pointless.
     *
     * @param string $channelhash
     * @return string
     */
    public function get_subscription_token(string $channelhash): string {
        global $USER;
        if (!self::is_channel_authorised($channelhash)) {
            throw new \moodle_exception('channelnotauthorised', 'realtimeplugin_centrifugo');
        }
        $client = new \phpcent\Client($this->get_api_url());
        $token = $client->setSecret($this->get_token_secret())->generateSubscriptionToken(
            $USER->id,
            $channelhash,
            \core\di::get(\core\clock::class)->time() + self::TOKEN_LIFETIME,
            []
        );
        return $token;
    }

    /**
     * Record that the user may subscribe to this channel, so its token can be refreshed later.
     *
     * @param string $channelhash
     */
    protected static function remember_channel(string $channelhash): void {
        $channels = self::get_authorised_channels();
        $channels[$channelhash] = \core\di::get(\core\clock::class)->time();
        $_SESSION[self::SESSION_CHANNELS_KEY] = $channels;
    }

    /**
     * Whether the user may subscribe to this channel in this session.
     *
     * @param string $channelhash
     * @return bool
     */
    protected static function is_channel_authorised(string $channelhash): bool {
        return isset(self::get_authorised_channels()[$channelhash]);
    }

    /**
     * The channels the user may subscribe to in this session, mapped to when access was granted.
     * Entries older than a day are dropped.
     *
     * @return array
     */
    protected static function get_authorised_channels(): array {
        $channels = $_SESSION[self::SESSION_CHANNELS_KEY] ?? [];
        if (!is_array($channels)) {
            return [];
        }
        $recent = \core\di::get(\core\clock::class)->time() - self::CHANNEL_LIFETIME;
        foreach ($channels as $channelhash => $granted) {
            if ((int) $granted <= $recent) {
                unset($channels[$channelhash]);
            }
        }
        return $channels;
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
            \core\di::get(\core\clock::class)->time() + self::TOKEN_LIFETIME,
            [],
            [],
            $meta
        );
        return $token;
    }
}
