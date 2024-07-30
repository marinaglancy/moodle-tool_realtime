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

/**
 * The tool_realtime test class.
 *
 * @covers     \tool_realtime\manager
 * @package    tool_realtime
 * @copyright  2020 Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class manager_test extends \advanced_testcase {

    public function test_is_enabled(): void {
        $this->assertNotEmpty(\tool_realtime\manager::get_enabled_plugin_name());
        $this->assertNotEmpty(\tool_realtime\manager::get_installed_plugins());
    }

    public function test_is_set_up(): void {
        $this->assertTrue(\tool_realtime\manager::get_plugin()->is_set_up());
        $this->assertTrue(\tool_realtime\manager::get_plugin()->is_enabled());
        $this->assertEquals(\tool_realtime\manager::get_enabled_plugin_name(), \tool_realtime\manager::get_plugin()->get_name());
    }
}
