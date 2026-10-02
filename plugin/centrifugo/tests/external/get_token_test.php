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

namespace realtimeplugin_centrifugo\external;

/**
 * Tests for the web service realtimeplugin_centrifugo_get_token
 *
 * @package    realtimeplugin_centrifugo
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \realtimeplugin_centrifugo\external\get_token
 */
final class get_token_test extends \advanced_testcase {
    /** @var string regular expression for a JWT token */
    private const JWT_REGEX = '/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/';

    /**
     * Configure the Centrifugo plugin and make it the enabled backend
     */
    protected function set_up_centrifugo(): void {
        set_config('enabled', 'centrifugo', 'tool_realtime');
        set_config('host', 'localhost:8000', 'realtimeplugin_centrifugo');
        set_config('apikey', 'testapikey', 'realtimeplugin_centrifugo');
        set_config('tokensecret', 'testsecret', 'realtimeplugin_centrifugo');
    }

    public function test_execute(): void {
        $this->resetAfterTest();
        $this->set_up_centrifugo();
        $this->setUser($this->getDataGenerator()->create_user());

        $result = get_token::execute();
        $result = \core_external\external_api::clean_returnvalue(get_token::execute_returns(), $result);
        $this->assertMatchesRegularExpression(self::JWT_REGEX, $result['token']);
    }

    public function test_execute_not_enabled(): void {
        $this->resetAfterTest();
        $this->set_up_centrifugo();
        set_config('enabled', 'phppoll', 'tool_realtime');
        $this->setUser($this->getDataGenerator()->create_user());

        $this->expectException(\moodle_exception::class);
        $this->expectExceptionMessage(get_string('realtimenotenabled', 'tool_realtime'));
        get_token::execute();
    }

    public function test_execute_guest_not_allowed(): void {
        $this->resetAfterTest();
        $this->set_up_centrifugo();
        set_config('allowguests', 0, 'tool_realtime');
        $this->setGuestUser();

        $this->expectException(\moodle_exception::class);
        $this->expectExceptionMessage(get_string('noguest', 'error'));
        get_token::execute();
    }

    public function test_execute_guest_allowed(): void {
        $this->resetAfterTest();
        $this->set_up_centrifugo();
        set_config('allowguests', 1, 'tool_realtime');
        $this->setGuestUser();

        $result = get_token::execute();
        $result = \core_external\external_api::clean_returnvalue(get_token::execute_returns(), $result);
        $this->assertMatchesRegularExpression(self::JWT_REGEX, $result['token']);
    }
}
