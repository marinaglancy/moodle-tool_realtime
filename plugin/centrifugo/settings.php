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

/**
 * Plugin settings for realtimeplugin_centrifugo.
 *
 * @package    realtimeplugin_centrifugo
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

 defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    global $PAGE;
    $rpcendpoint = $CFG->wwwroot . '/admin/tool/realtime/plugin/centrifugo/webhook-rpc.php';
    $importbtn = html_writer::tag(
        'button',
        get_string('importbutton', 'realtimeplugin_centrifugo'),
        [
            'type' => 'button',
            'class' => 'btn btn-secondary mt-3',
            'id' => 'realtimeplugin_centrifugo_importbtn',
        ]
    );
    $settings->add(new admin_setting_heading(
        'realtimeplugin_centrifugo/intro',
        '',
        get_string(
            'configintro',
            'realtimeplugin_centrifugo',
            [
                'railwayurl' => 'https://railway.com/deploy/centrifugo-for-moodle',
                'webhookurl' => $rpcendpoint,
            ]
        ) . '<br/>' . $importbtn
    ));
    $PAGE->requires->js_call_amd('realtimeplugin_centrifugo/import_settings', 'init');
    $settings->add(new admin_setting_configtext(
        'realtimeplugin_centrifugo/host',
        new lang_string('host', 'realtimeplugin_centrifugo'),
        new lang_string('host_desc', 'realtimeplugin_centrifugo'),
        ''
    ));
    $settings->add(new admin_setting_configselect(
        'realtimeplugin_centrifugo/usessl',
        new lang_string('usessl', 'realtimeplugin_centrifugo'),
        new lang_string('usessl_desc', 'realtimeplugin_centrifugo'),
        1,
        [0 => get_string('no'), 1 => get_string('yes')]
    ));
    $settings->add(new admin_setting_configpasswordunmask(
        'realtimeplugin_centrifugo/apikey',
        new lang_string('apikey', 'realtimeplugin_centrifugo'),
        new lang_string('apikey_desc', 'realtimeplugin_centrifugo'),
        ''
    ));
    $settings->add(new admin_setting_configpasswordunmask(
        'realtimeplugin_centrifugo/tokensecret',
        new lang_string('tokensecret', 'realtimeplugin_centrifugo'),
        new lang_string('tokensecret_desc', 'realtimeplugin_centrifugo'),
        ''
    ));
    $settings->add(new admin_setting_configselect(
        'realtimeplugin_centrifugo/userpc',
        new lang_string('userpc', 'realtimeplugin_centrifugo'),
        new lang_string('userpc_desc', 'realtimeplugin_centrifugo'),
        1,
        [0 => get_string('no'), 1 => get_string('yes')]
    ));
    $settings->add(new admin_setting_configpasswordunmask(
        'realtimeplugin_centrifugo/webhookkey',
        new lang_string('webhookkey', 'realtimeplugin_centrifugo'),
        new lang_string(
            'webhookkey_desc',
            'realtimeplugin_centrifugo',
            $rpcendpoint
        ),
        ''
    ));
}
