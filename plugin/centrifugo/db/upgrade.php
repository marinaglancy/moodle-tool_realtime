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
 * Upgrade steps for Centrifugo
 *
 * Documentation: {@link https://moodledev.io/docs/guides/upgrade}
 *
 * @package    realtimeplugin_centrifugo
 * @category   upgrade
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Execute the plugin upgrade steps from the given old version.
 *
 * @param int $oldversion
 * @return bool
 */
function xmldb_realtimeplugin_centrifugo_upgrade($oldversion) {

    if ($oldversion < 2026021600) {
        // Migrate settings from jsonconfig JSON blob to individual settings.
        $jsonconfig = get_config('realtimeplugin_centrifugo', 'jsonconfig');
        $config = @json_decode($jsonconfig, true);
        if (is_array($config)) {
            // Migrate API key.
            $apikey = $config['CENTRIFUGO_HTTP_API_KEY'] ?? $config['http_api']['key'] ?? '';
            if ($apikey !== '') {
                set_config('apikey', $apikey, 'realtimeplugin_centrifugo');
            }

            // Migrate token HMAC secret.
            $tokensecret = $config['CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY']
                ?? $config['client']['token']['hmac_secret_key'] ?? '';
            if ($tokensecret !== '') {
                set_config('tokensecret', $tokensecret, 'realtimeplugin_centrifugo');
            }

            // Migrate webhook key.
            $webhookkey = $config['MOODLE_WEBHOOK_KEY'] ?? '';
            if ($webhookkey === '' && !empty($config['proxies'])) {
                foreach ($config['proxies'] as $proxy) {
                    $key = $proxy['http']['static_headers']['X-Moodle-Key'] ?? '';
                    if ($key !== '') {
                        $webhookkey = $key;
                        break;
                    }
                }
            }
            if ($webhookkey !== '') {
                set_config('webhookkey', $webhookkey, 'realtimeplugin_centrifugo');
            }
        }

        // Delete the jsonconfig setting.
        unset_config('jsonconfig', 'realtimeplugin_centrifugo');

        upgrade_plugin_savepoint(true, 2026021600, 'realtimeplugin', 'centrifugo');
    }

    return true;
}
