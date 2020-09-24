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
 * Plugin administration pages are defined here.
 *
 * @package     realtimeplugin_pusher
 * @copyright  2020 Daniel Conquit, Matthew Gray, Nicholas Parker, Dan Thistlethwaite
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings->add(new admin_setting_configtext('realtimeplugin_pusher/app_id',
            new lang_string('app_id', 'realtimeplugin_pusher'),
            new lang_string('app_id', 'realtimeplugin_pusher'), '')
    );

    $settings->add(new admin_setting_configtext('realtimeplugin_pusher/key',
            new lang_string('key', 'realtimeplugin_pusher'),
            new lang_string('key', 'realtimeplugin_pusher'), '')
    );

    $settings->add(new admin_setting_configtext('realtimeplugin_pusher/secret',
            new lang_string('secret', 'realtimeplugin_pusher'),
            new lang_string('secret', 'realtimeplugin_pusher'), '')
    );

    $settings->add(new admin_setting_configtext('realtimeplugin_pusher/cluster',
            new lang_string('cluster', 'realtimeplugin_pusher'),
            new lang_string('cluster', 'realtimeplugin_pusher'), '')
    );
}
