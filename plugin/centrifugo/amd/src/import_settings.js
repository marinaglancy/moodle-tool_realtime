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
 * Import settings from Centrifugo configuration or Railway template variables.
 *
 * @module     realtimeplugin_centrifugo/import_settings
 * @copyright  2026 Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import ModalSaveCancel from 'core/modal_save_cancel';
import ModalEvents from 'core/modal_events';
import {getString} from 'core/str';

const COMPONENT = 'realtimeplugin_centrifugo';
const SETTINGS_PREFIX = 'id_s_realtimeplugin_centrifugo_';

/**
 * Parse Centrifugo native JSON configuration.
 *
 * @param {Object} data Parsed JSON object
 * @returns {Object} Extracted settings
 */
const parseCentrifugoConfig = (data) => {
    const result = {
        apikey: data?.http_api?.key || '',
        tokensecret: data?.client?.token?.hmac_secret_key || '',
        webhookkey: '',
    };

    if (Array.isArray(data?.proxies)) {
        let fallbackKey = '';
        for (const proxy of data.proxies) {
            const headers = proxy?.http?.static_headers || {};
            const headerEntry = Object.entries(headers).find(([k]) => k.toLowerCase() === 'x-moodle-key');
            const key = headerEntry ? headerEntry[1] : '';
            if (key) {
                fallbackKey = key;
                if (proxy.endpoint && proxy.endpoint.includes('webhook-rpc.php')) {
                    result.webhookkey = key;
                    break;
                }
            }
        }
        if (!result.webhookkey) {
            result.webhookkey = fallbackKey;
        }
    }

    return result;
};

/**
 * Parse Railway template variables (flat key-value JSON).
 *
 * @param {Object} data Parsed JSON object
 * @returns {Object} Extracted settings
 */
const parseRailwayJson = (data) => ({
    apikey: data.CENTRIFUGO_HTTP_API_KEY || '',
    tokensecret: data.CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY || '',
    webhookkey: data.MOODLE_WEBHOOK_KEY || '',
    host: data.HOST || '',
});

/**
 * Parse Railway .env format (KEY="VALUE" lines).
 *
 * @param {string} text Raw .env content
 * @returns {Object} Extracted settings
 */
const parseEnvFormat = (text) => {
    const vars = {};
    for (const line of text.split('\n')) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)="?(.*?)"?\s*$/);
        if (match) {
            vars[match[1]] = match[2];
        }
    }
    return {
        apikey: vars.CENTRIFUGO_HTTP_API_KEY || '',
        tokensecret: vars.CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY || '',
        webhookkey: vars.MOODLE_WEBHOOK_KEY || '',
    };
};

/**
 * Parse input text and extract settings.
 *
 * @param {string} text Raw input from textarea
 * @returns {Object|null} Extracted settings or null on failure
 */
const parseInput = (text) => {
    text = text.trim();
    if (!text) {
        return null;
    }

    // Try JSON first.
    if (text.startsWith('{')) {
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            return null;
        }
        let result;
        // Detect Railway JSON format by presence of flat CENTRIFUGO_ keys.
        if (data.CENTRIFUGO_HTTP_API_KEY !== undefined || data.CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY !== undefined) {
            result = parseRailwayJson(data);
        } else {
            // Otherwise treat as native Centrifugo config.
            result = parseCentrifugoConfig(data);
        }
        if (!result.apikey && !result.tokensecret && !result.webhookkey && !result.host) {
            return null;
        }
        return result;
    }

    // Try .env format.
    const result = parseEnvFormat(text);
    if (!result.apikey && !result.tokensecret && !result.webhookkey) {
        return null;
    }
    return result;
};

/**
 * Set value on a password unmask or regular input field.
 *
 * @param {string} settingName Setting name (e.g. 'apikey')
 * @param {string} value Value to set
 */
const setFieldValue = (settingName, value) => {
    const input = document.getElementById(SETTINGS_PREFIX + settingName);
    if (!input || !value) {
        return;
    }
    input.value = value;

    // For password unmask widgets, update the dot display.
    const wrapper = input.closest('[data-passwordunmask="wrapper"]');
    if (wrapper) {
        // Click the edit link to enter edit mode, which makes the input visible with the new value.
        const editLink = wrapper.querySelector('a[data-passwordunmask="edit"]');
        if (editLink) {
            editLink.click();
        }
    }
};

/**
 * Initialise the import button.
 */
export const init = async() => {
    const btn = document.getElementById('realtimeplugin_centrifugo_importbtn');
    if (!btn) {
        return;
    }

    const errorMsg = await getString('importerror', COMPONENT);

    const modal = await ModalSaveCancel.create({
        title: getString('importtitle', COMPONENT),
        body: getString('importbody', COMPONENT).then((desc) =>
            '<p>' + desc + '</p>' +
            '<textarea id="centrifugo-import-textarea" class="form-control" rows="10"></textarea>' +
            '<div id="centrifugo-import-error" class="text-danger mt-2" style="display:none;"></div>'
        ),
        buttons: {
            save: getString('importbutton', COMPONENT),
        },
        removeOnClose: false,
    });

    modal.getRoot().on(ModalEvents.save, (e) => {
        e.preventDefault();

        const textarea = document.getElementById('centrifugo-import-textarea');
        const result = parseInput(textarea ? textarea.value : '');

        const errorEl = document.getElementById('centrifugo-import-error');
        if (!result) {
            if (errorEl) {
                errorEl.textContent = errorMsg;
                errorEl.style.display = '';
            }
            return;
        }
        if (errorEl) {
            errorEl.style.display = 'none';
        }

        setFieldValue('apikey', result.apikey);
        setFieldValue('tokensecret', result.tokensecret);
        setFieldValue('webhookkey', result.webhookkey);
        setFieldValue('host', result.host);
        modal.hide();
    });

    btn.addEventListener('click', () => {
        // Clear previous state each time the modal is opened.
        const textarea = document.getElementById('centrifugo-import-textarea');
        if (textarea) {
            textarea.value = '';
        }
        const errorEl = document.getElementById('centrifugo-import-error');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
        modal.show();
    });
};
