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
 * File containing tests for realtimeplugin_phppoll.
 *
 * @package     realtimeplugin_phppoll
 * @category    test
 * @copyright   2020 Marina Glancy
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace realtimeplugin_phppoll;

use advanced_testcase;
use context_user;

/**
 * The realtimeplugin_phppoll test class.
 *
 * @covers     \realtimeplugin_phppoll\plugin
 * @package    realtimeplugin_phppoll
 * @copyright  2020 Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class plugin_test extends advanced_testcase {

    public function test_notify_and_get_all(): void {
        global $USER;
        $this->resetAfterTest();
        /** @var plugin $plugin */
        $plugin = \tool_realtime\manager::get_plugin();
        $this->assertInstanceOf(plugin::class, $plugin);
        $this->setAdminUser();
        $context = context_user::instance($USER->id);
        $channel = new \tool_realtime\channel($context, 'testcomponent', 'testarea', 7, 'x');
        $plugin->subscribe($channel);
        $plugin->notify($channel, ['a' => 'b']);
        $results = $plugin->get_all([$channel->get_hash()], 0);
        $this->assertCount(1, $results);
        $result = (array)reset($results);
        unset($result['id']);
        $this->assertEquals([
            'component' => 'testcomponent',
            'area' => 'testarea',
            'itemid' => 7,
            'channeldetails' => 'x',
            'payload' => ['a' => 'b'],
            'context' => [
                'id' => $context->id,
                'contextlevel' => CONTEXT_USER,
                'instanceid' => $USER->id,
            ],
        ], $result);
    }
}
