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

    public function test_use_rpc_enabled_with_key(): void {
        $this->resetAfterTest();
        set_config('userpc', '1', 'realtimeplugin_centrifugo');
        set_config('webhookkey', 'testkey', 'realtimeplugin_centrifugo');

        $plugin = new plugin();
        $this->assertTrue($plugin->use_rpc());
    }

    public function test_use_rpc_disabled(): void {
        $this->resetAfterTest();
        set_config('userpc', '0', 'realtimeplugin_centrifugo');
        set_config('webhookkey', 'testkey', 'realtimeplugin_centrifugo');

        $plugin = new plugin();
        $this->assertFalse($plugin->use_rpc());
    }

    public function test_use_rpc_enabled_without_key(): void {
        $this->resetAfterTest();
        set_config('userpc', '1', 'realtimeplugin_centrifugo');

        $plugin = new plugin();
        $this->assertFalse($plugin->use_rpc());
    }

    public function test_get_rpc_header(): void {
        $this->resetAfterTest();
        set_config('webhookkey', 'mykey', 'realtimeplugin_centrifugo');

        $plugin = new plugin();
        $this->assertEquals('mykey', $plugin->get_rpc_header());
    }

    public function test_get_rpc_header_empty(): void {
        $this->resetAfterTest();

        $plugin = new plugin();
        $this->assertNull($plugin->get_rpc_header());
    }

    public function test_get_rpc_endpoint(): void {
        $plugin = new plugin();
        $this->assertStringEndsWith(
            '/admin/tool/realtime/plugin/centrifugo/webhook-rpc.php',
            $plugin->get_rpc_endpoint()
        );
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
}
