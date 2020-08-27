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

///**
// * Trigger a pusher event
// *
// * @package     realtimeplugin_pusher
// * @copyright  2020 Daniel Conquit, Matthew Gray, Nicholas Parker, Dan Thistlewaite
// * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
// */
//
//define('AJAX_SCRIPT', true);
//define('NO_MOODLE_COOKIES', true);
//// @codingStandardsIgnoreLine This script does not require login.
//require_once(__DIR__ . '/../../../../../../../config.php');

require __DIR__ . '/../../../../../vendor/autoload.php';

$options = array(
    'cluster' => 'ap4',
    'useTLS' => true
);
$pusher = new Pusher\Pusher(
    '65838683395f44b4af82',
    'ceb46ac6bbb1b1a0b318',
    '1061962',
    $options
);

$data['message'] = 'hello Matt :P';
$pusher->trigger('1:thiscomponent:pingtest:1', 'event', $data);