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
 * English language pack for realtimeplugin_centrifugo
 *
 * @package    realtimeplugin_centrifugo
 * @category   string
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// phpcs:disable moodle.Strings.ForbiddenStrings.Found

defined('MOODLE_INTERNAL') || die();

$string['apikey'] = 'HTTP API key';
$string['apikey_desc'] = 'API key for authenticating server-to-Centrifugo requests (publishing events). Corresponds to `api_key` in Centrifugo server configuration. Railway template variable: `CENTRIFUGO_HTTP_API_KEY`.';
$string['configintro'] = 'This plugin enables real-time communication via WebSockets using <a href="https://centrifugal.dev/" target="_blank">Centrifugo</a>, an open-source scalable real-time messaging server.

The easiest way to set up your own Centrifugo hosting is to use the <a href="{$a->railwayurl}" target="_blank">Railway template</a>. When deploying from the template, set `MOODLE_WEBHOOK_URL` to `{$a->webhookurl}` and all secrets will be randomly generated. After that, copy the deployed URL and other variables into the settings below.<br><br>
Step-by-step deployment instructions are available at <a href="https://lmscloud.io/plugins/tool_realtime/" target="_blank">lmscloud.io/plugins/tool_realtime</a>.';
$string['host'] = 'Host';
$string['host_desc'] = "Host and port of Centrifugo, example: `abcdef.com:8000`

Do not include protocol or path. They will be added automatically, in the example above the full URLs will be `wss://abcdef.com:8000/connection/websocket` for the websocket and `https://abcdef.com:8000/api` for requesting authentication tokens.";
$string['importbody'] = 'Paste the contents of the <b>_EXPORT_TO_MOODLE</b> variable after deploying the Railway template, or paste your Centrifugo server configuration.<br><br>
Values for <b>HTTP API key</b>, <b>Token HMAC secret</b>, <b>Webhook key</b> and <b>Host</b> (if present) will be extracted and inserted into the settings form. No other settings will be used or stored. You will need to submit the settings form to save the changes.';
$string['importbutton'] = 'Import settings';
$string['importerror'] = 'Could not parse the configuration.';
$string['importtitle'] = 'Import settings';
$string['pluginname'] = 'Centrifugo';
$string['privacy:metadata'] = 'The Centrifugo plugin does not store any personal data.';
$string['tokensecret'] = 'Token HMAC secret';
$string['tokensecret_desc'] = 'HMAC secret key used to sign JWT connection tokens for WebSocket authentication. Corresponds to `token_hmac_secret_key` in Centrifugo server configuration. Railway template variable: `CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY`.';
$string['userpc'] = 'Use RPC for client-to-server events';
$string['userpc_desc'] = 'When enabled, client-to-server events are sent through Centrifugo RPC proxy to the Moodle webhook endpoint. When disabled, standard Moodle AJAX requests are used instead. Requires the webhook key to be configured.';
$string['usessl'] = 'Use SSL';
$string['usessl_desc'] = 'Use SSL for the websocket connection. If disabled, the connection will be made using protocols `ws://` and `http://` instead of `wss://` and `https://`.';
$string['webhookkey'] = 'Webhook key';
$string['webhookkey_desc'] = 'Shared authentication key for RPC requests. Only required when RPC is enabled. To set up RPC, add a proxy in Centrifugo configuration with endpoint `{$a}` and specify a static HTTP header `X-Moodle-Key` with the same value as this setting. Railway template variable: `MOODLE_WEBHOOK_KEY`.';
