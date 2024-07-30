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
 * @package     realtimeplugin_phppoll
 * @copyright   2020 Marina Glancy
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings->add(new admin_setting_configduration('realtimeplugin_phppoll/requesttimeout',
            new lang_string('requesttimeout', 'realtimeplugin_phppoll'),
            new lang_string('requesttimeoutdesc', 'realtimeplugin_phppoll'), 30)
    );

    $settings->add(new admin_setting_configtext('realtimeplugin_phppoll/checkinterval',
            new lang_string('checkinterval', 'realtimeplugin_phppoll'),
            new lang_string('checkintervaldesc', 'realtimeplugin_phppoll', 200), 1000)
    );
}
