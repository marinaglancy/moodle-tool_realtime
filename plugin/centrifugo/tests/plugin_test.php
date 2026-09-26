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

/**
 * Tests for the centrifugo plugin
 *
 * @package    realtimeplugin_centrifugo
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \realtimeplugin_centrifugo\plugin
 */
final class plugin_test extends \advanced_testcase {
    public function test_is_set_up_with_all_settings(): void {
        $this->resetAfterTest();
        set_config('host', 'localhost:8000', 'realtimeplugin_centrifugo');
        set_config('apikey', 'testapikey', 'realtimeplugin_centrifugo');
        set_config('tokensecret', 'testsecret', 'realtimeplugin_centrifugo');

        $plugin = new plugin();
        $this->assertTrue($plugin->is_set_up());
    }

    public function test_is_set_up_missing_host(): void {
        $this->resetAfterTest();
        set_config('apikey', 'testapikey', 'realtimeplugin_centrifugo');
        set_config('tokensecret', 'testsecret', 'realtimeplugin_centrifugo');

        $plugin = new plugin();
        $this->assertFalse($plugin->is_set_up());
    }

    public function test_is_set_up_missing_apikey(): void {
        $this->resetAfterTest();
        set_config('host', 'localhost:8000', 'realtimeplugin_centrifugo');
        set_config('tokensecret', 'testsecret', 'realtimeplugin_centrifugo');

        $plugin = new plugin();
        $this->assertFalse($plugin->is_set_up());
    }

    public function test_is_set_up_missing_tokensecret(): void {
        $this->resetAfterTest();
        set_config('host', 'localhost:8000', 'realtimeplugin_centrifugo');
        set_config('apikey', 'testapikey', 'realtimeplugin_centrifugo');

        $plugin = new plugin();
        $this->assertFalse($plugin->is_set_up());
    }

    public function test_get_token(): void {
        $this->resetAfterTest();
        set_config('host', 'localhost:8000', 'realtimeplugin_centrifugo');
        set_config('tokensecret', 'testsecret', 'realtimeplugin_centrifugo');
        $this->setUser($this->getDataGenerator()->create_user());

        $plugin = new plugin();
        $token = $plugin->get_token();

        // Token should be a valid JWT (three base64url-encoded parts separated by dots).
        $this->assertMatchesRegularExpression('/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/', $token);
    }

    public function test_get_subscription_token(): void {
        $this->resetAfterTest();
        $this->setup_plugin();
        $user = $this->getDataGenerator()->create_user();
        $this->setUser($user);
        $channel = $this->create_channel();

        $plugin = new plugin();
        $plugin->subscribe($channel);

        $now = \core\di::get(\core\clock::class)->time();
        $token = $plugin->get_subscription_token($channel->get_hash());
        $payload = $this->decode_jwt($token);

        $this->assertEquals($channel->get_hash(), $payload['channel']);
        $this->assertEquals((string) $user->id, $payload['sub']);
        $this->assertGreaterThan($now, $payload['exp']);
        $this->assertLessThanOrEqual($now + plugin::TOKEN_LIFETIME, $payload['exp']);
    }

    public function test_get_subscription_token_not_subscribed(): void {
        $this->resetAfterTest();
        $this->setup_plugin();
        $this->setUser($this->getDataGenerator()->create_user());
        $channel = $this->create_channel();

        $plugin = new plugin();
        // Never subscribed to this channel.
        $this->expectException(\moodle_exception::class);
        $plugin->get_subscription_token($channel->get_hash());
    }

    public function test_get_subscription_token_other_channel(): void {
        $this->resetAfterTest();
        $this->setup_plugin();
        $this->setUser($this->getDataGenerator()->create_user());
        $channel = $this->create_channel();
        $otherchannel = new \tool_realtime\channel(\context_system::instance(), 'mod_forum', 'discussions', 43);

        $plugin = new plugin();
        $plugin->subscribe($channel);

        // One channel does not authorise another.
        $this->expectException(\moodle_exception::class);
        $plugin->get_subscription_token($otherchannel->get_hash());
    }

    public function test_get_subscription_token_webservice(): void {
        $this->resetAfterTest();
        $this->setup_plugin();
        $this->setUser($this->getDataGenerator()->create_user());
        $channel = $this->create_channel();

        $plugin = new plugin();
        $plugin->subscribe($channel);

        // Go through the web service, the parameters are passed to execute() positionally.
        $_POST['sesskey'] = sesskey();
        $result = \core_external\external_api::call_external_function(
            'realtimeplugin_centrifugo_get_subscription_token',
            ['channel' => $channel->get_hash()]
        );

        $this->assertFalse($result['error'], print_r($result['exception'] ?? [], true));
        $this->assertEquals($channel->get_hash(), $this->decode_jwt($result['data']['token'])['channel']);
    }

    public function test_get_subscription_token_webservice_not_subscribed(): void {
        $this->resetAfterTest();
        $this->setup_plugin();
        $this->setUser($this->getDataGenerator()->create_user());
        $channel = $this->create_channel();

        $_POST['sesskey'] = sesskey();
        $result = \core_external\external_api::call_external_function(
            'realtimeplugin_centrifugo_get_subscription_token',
            ['channel' => $channel->get_hash()]
        );

        $this->assertTrue($result['error']);
        $this->assertEquals('channelnotauthorised', $result['exception']->errorcode);
    }

    /**
     * Set the plugin settings.
     */
    private function setup_plugin(): void {
        set_config('host', 'localhost:8000', 'realtimeplugin_centrifugo');
        set_config('apikey', 'testapikey', 'realtimeplugin_centrifugo');
        set_config('tokensecret', 'testsecret', 'realtimeplugin_centrifugo');
    }

    /**
     * Create a channel in the system context.
     *
     * @return \tool_realtime\channel
     */
    private function create_channel(): \tool_realtime\channel {
        return new \tool_realtime\channel(\context_system::instance(), 'mod_forum', 'discussions', 42);
    }

    /**
     * Decode a JWT payload, without verifying the signature.
     *
     * @param string $jwt
     * @return array
     */
    private function decode_jwt(string $jwt): array {
        $parts = explode('.', $jwt);
        $this->assertCount(3, $parts);
        return json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
    }
}
