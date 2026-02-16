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
 * JavaScript for the test settings page
 *
 * @module     tool_realtime/test_settings
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Ajax from 'core/ajax';
import Config from 'core/config';
import * as PubSub from 'core/pubsub';
import RealTimeEvents from 'tool_realtime/events';
import {sendToServer} from 'tool_realtime/api';

/** @type {number} Seconds without events before showing timeout warning */
const RECEIVE_TIMEOUT_SEC = 90;

const SELECTORS = {
    root: '#tool-realtime-test-settings',
    stat: (name) => `[data-stat="${name}"]`,
    action: (name) => `[data-action="${name}"]`,
    field: (name) => `[data-field="${name}"]`,
    region: (name) => `[data-region="${name}"]`,
};

/** @type {Object} Stats for receive test */
let receiveStats = null;

/** @type {Object} Stats for push test */
let pushStats = null;

/** @type {number|null} Timer ID for receive timeout detection */
let receiveTimeoutId = null;

/** @type {number|null} Estimated clock offset (server - browser) in ms, null if not yet calibrated */
let clockOffset = null;

/** @type {number} Number of calibration round-trips */
const CALIBRATION_SAMPLES = 5;

/**
 * Generate a unique burst identifier
 *
 * @return {string}
 */
const generateBurstId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/**
 * Reset receive stats
 *
 * @param {string} burstid
 */
const resetReceiveStats = (burstid = '') => {
    clearReceiveTimeout();
    receiveStats = {
        count: 0,
        expected: 0,
        totalLatency: 0,
        min: Infinity,
        max: -Infinity,
        latencies: [],
        errors: 0,
        errorMessages: [],
        seqReceived: new Set(),
        burstid: burstid,
    };
};

/**
 * Reset push stats
 */
const resetPushStats = () => {
    pushStats = {
        count: 0,
        expected: 0,
        totalRtt: 0,
        min: Infinity,
        max: -Infinity,
        errors: 0,
        errorMessages: [],
    };
};

/**
 * Get the root element
 *
 * @return {HTMLElement}
 */
const getRoot = () => document.querySelector(SELECTORS.root);

/**
 * Update a stat display element
 *
 * @param {string} name
 * @param {string} value
 */
const updateStat = (name, value) => {
    const el = getRoot().querySelector(SELECTORS.stat(name));
    if (el) {
        el.textContent = value;
    }
};

/**
 * Show a results region
 *
 * @param {string} name
 */
const showRegion = (name) => {
    const el = getRoot().querySelector(SELECTORS.region(name));
    if (el) {
        el.classList.remove('d-none');
    }
};

/**
 * Hide a results region
 *
 * @param {string} name
 */
const hideRegion = (name) => {
    const el = getRoot().querySelector(SELECTORS.region(name));
    if (el) {
        el.classList.add('d-none');
    }
};

/**
 * Show the reset button for a section
 *
 * @param {string} section
 */
const showResetButton = (section) => {
    const el = getRoot().querySelector(SELECTORS.action(section + '-reset'));
    if (el) {
        el.classList.remove('d-none');
    }
};

/**
 * Get field value
 *
 * @param {string} name
 * @param {number} defaultValue
 * @return {number}
 */
const getFieldValue = (name, defaultValue = 1) => {
    const el = getRoot().querySelector(SELECTORS.field(name));
    if (!el) {
        return defaultValue;
    }
    const val = parseInt(el.value, 10);
    return isNaN(val) ? defaultValue : val;
};

/**
 * Format milliseconds for display
 *
 * @param {number} ms
 * @return {string}
 */
const formatMs = (ms) => Math.round(ms) + ' ms';

/**
 * Extract a readable error message from various error object formats
 *
 * Moodle Ajax errors can be plain strings, Error objects, or objects with
 * .message, .error, or .debuginfo properties.
 *
 * @param {*} err
 * @return {string}
 */
const extractErrorMessage = (err) => {
    if (!err) {
        return 'Unknown error';
    }
    if (typeof err === 'string') {
        return err;
    }
    if (err.message) {
        return err.message;
    }
    if (err.error) {
        return err.error + (err.debuginfo ? ' (' + err.debuginfo + ')' : '');
    }
    return String(err);
};

/**
 * Add an error to receive stats and update the display
 *
 * @param {string} message
 */
const addReceiveError = (message) => {
    if (!receiveStats) {
        resetReceiveStats();
    }
    receiveStats.errors++;
    receiveStats.errorMessages.push(message);
};

/**
 * Clear the receive timeout timer
 */
const clearReceiveTimeout = () => {
    if (receiveTimeoutId !== null) {
        clearTimeout(receiveTimeoutId);
        receiveTimeoutId = null;
    }
};

/**
 * Start or reset the receive timeout timer
 *
 * If no events arrive within RECEIVE_TIMEOUT_SEC seconds, records a timeout error.
 */
const resetReceiveTimeout = () => {
    clearReceiveTimeout();
    if (receiveStats && receiveStats.expected > 0 && receiveStats.count < receiveStats.expected) {
        receiveTimeoutId = setTimeout(() => {
            const missing = receiveStats.expected - receiveStats.count;
            addReceiveError('Timeout: ' + missing + ' event(s) not received within ' + RECEIVE_TIMEOUT_SEC + 's');
            updateStat('receive-status', 'Timeout (' + receiveStats.count + ' of ' + receiveStats.expected + ' received)');
            updateReceiveDisplay();
        }, RECEIVE_TIMEOUT_SEC * 1000);
    }
};

/**
 * Update the adjusted latency column from raw latencies and current clockOffset.
 * Can be called after recalibration to refresh already-displayed results.
 */
const updateAdjustedDisplay = () => {
    if (!receiveStats || receiveStats.count === 0) {
        updateStat('receive-avg-adjusted', '');
        updateStat('receive-minmax-adjusted', '');
        return;
    }
    if (clockOffset === null) {
        updateStat('receive-avg-adjusted', '');
        updateStat('receive-minmax-adjusted', '');
        return;
    }
    let total = 0;
    let min = Infinity;
    let max = -Infinity;
    for (const raw of receiveStats.latencies) {
        const adjusted = raw + clockOffset;
        total += adjusted;
        min = Math.min(min, adjusted);
        max = Math.max(max, adjusted);
    }
    const avg = total / receiveStats.latencies.length;
    updateStat('receive-avg-adjusted', formatMs(avg) + ' (adjusted)');
    updateStat('receive-minmax-adjusted', formatMs(min) + ' / ' + formatMs(max) + ' (adjusted)');
};

/**
 * Update receive stats display
 */
const updateReceiveDisplay = () => {
    showRegion('receive-results');
    showResetButton('receive');

    const countText = receiveStats.expected > 0
        ? receiveStats.count + ' / ' + receiveStats.expected
        : String(receiveStats.count);
    updateStat('receive-count', countText);
    updateStat('receive-errors', String(receiveStats.errors));

    if (receiveStats.count > 0) {
        const avg = receiveStats.totalLatency / receiveStats.count;
        updateStat('receive-avg', formatMs(avg));
        updateStat('receive-minmax', formatMs(receiveStats.min) + ' / ' + formatMs(receiveStats.max));

        updateAdjustedDisplay();
    }

    if (receiveStats.errors > 0) {
        showRegion('receive-error-details');
        const el = getRoot().querySelector(SELECTORS.region('receive-error-messages'));
        if (el) {
            el.textContent = receiveStats.errorMessages.join('\n');
        }
    }

    if (receiveStats.expected > 0 && receiveStats.count >= receiveStats.expected) {
        clearReceiveTimeout();
        updateStat('receive-status', receiveStats.errors > 0 ? 'Complete (with errors)' : 'Complete');
    }
};

/**
 * Update push stats display
 */
const updatePushDisplay = () => {
    showRegion('push-results');
    showResetButton('push');

    const countText = pushStats.expected > 0
        ? pushStats.count + ' / ' + pushStats.expected
        : String(pushStats.count);
    updateStat('push-count', countText);
    updateStat('push-errors', String(pushStats.errors));

    if (pushStats.count > 0) {
        const avg = pushStats.totalRtt / pushStats.count;
        updateStat('push-avg', formatMs(avg));
        updateStat('push-minmax', formatMs(pushStats.min) + ' / ' + formatMs(pushStats.max));
    }

    if (pushStats.errors > 0) {
        showRegion('push-error-details');
        const el = getRoot().querySelector(SELECTORS.region('push-error-messages'));
        if (el) {
            el.textContent = pushStats.errorMessages.join('\n');
        }
    }

    if (pushStats.expected > 0 && (pushStats.count + pushStats.errors) >= pushStats.expected) {
        updateStat('push-status', pushStats.errors > 0 ? 'Complete (with errors)' : 'Complete');
    }
};

/**
 * Handle incoming realtime event for the receive test
 *
 * @param {Object} data
 */
const onEventReceived = (data) => {
    if (data.component !== 'tool_realtime' || data.area !== 'test') {
        return;
    }
    if (!receiveStats) {
        return;
    }

    const payload = data.payload || {};

    // Ignore events from a different burst.
    if (receiveStats.burstid && payload.burstid !== receiveStats.burstid) {
        return;
    }

    const now = Date.now();
    const senttime = parseInt(payload.senttime, 10);
    const seq = parseInt(payload.seq, 10);
    const total = parseInt(payload.total, 10);

    if (total > 0) {
        receiveStats.expected = total;
    }

    // Validate payload has required senttime.
    if (!senttime || isNaN(senttime) || senttime <= 0) {
        addReceiveError('Event received with missing or invalid senttime: ' + JSON.stringify(payload));
        updateReceiveDisplay();
        return;
    }

    // Check for duplicate sequence numbers (only meaningful during burst tests).
    if (receiveStats.expected > 1 && !isNaN(seq)) {
        if (receiveStats.seqReceived.has(seq)) {
            addReceiveError('Duplicate event received for seq=' + seq);
        }
        receiveStats.seqReceived.add(seq);
    }

    const latency = now - senttime;
    receiveStats.count++;
    receiveStats.totalLatency += latency;
    receiveStats.min = Math.min(receiveStats.min, latency);
    receiveStats.max = Math.max(receiveStats.max, latency);
    receiveStats.latencies.push(latency);

    updateStat('receive-status', 'Receiving...');
    resetReceiveTimeout();
    updateReceiveDisplay();
};

/**
 * Calibrate the clock offset between browser and server
 *
 * Sends CALIBRATION_SAMPLES AJAX requests and measures apparent one-way delays in each direction.
 * The server returns its midpoint timestamp, so processing time is split evenly.
 * offset = (avgToServer - avgFromServer) / 2 estimates the server-browser clock difference.
 *
 * @return {Promise<void>}
 */
const calibrateClockOffset = async() => {
    const infoEl = getRoot().querySelector(SELECTORS.region('calibration-info'));
    if (infoEl) {
        infoEl.textContent = 'Calibrating...';
    }
    const recalibrateLink = getRoot().querySelector(SELECTORS.action('recalibrate'));
    if (recalibrateLink) {
        recalibrateLink.classList.add('d-none');
    }

    const timeUrl = Config.wwwroot + '/admin/tool/realtime/time.php';
    const toServerSamples = [];
    const fromServerSamples = [];

    for (let i = 0; i < CALIBRATION_SAMPLES; i++) {
        try {
            const t1 = Date.now();
            const response = await fetch(timeUrl);
            const t4 = Date.now();
            const text = await response.text();
            const t2 = Math.round(parseFloat(text) * 1000);

            if (t2 > 0) {
                toServerSamples.push(t2 - t1);
                fromServerSamples.push(t4 - t2);
            }
        } catch (err) {
            window.console.warn('Clock calibration sample failed:', err);
        }
    }

    if (toServerSamples.length === 0) {
        if (infoEl) {
            infoEl.textContent = 'Clock calibration failed.';
        }
        return;
    }

    const avgToServer = toServerSamples.reduce((a, b) => a + b) / toServerSamples.length;
    const avgFromServer = fromServerSamples.reduce((a, b) => a + b) / fromServerSamples.length;
    const estimatedOffset = (avgToServer - avgFromServer) / 2;
    const threshold = 5;

    if (infoEl) {
        let text = 'Average request delay: ' + Math.round(avgToServer) + ' ms (browser \u2192 server), '
            + Math.round(avgFromServer) + ' ms (server \u2192 browser).';
        if (Math.abs(estimatedOffset) > threshold) {
            clockOffset = estimatedOffset;
            const sign = clockOffset >= 0 ? '+' : '';
            text += ' Clocks appear to differ by ~' + sign + Math.round(clockOffset)
                + ' ms. Latency values will be adjusted.';
        } else {
            clockOffset = null;
            text += ' Browser and server clocks appear to be synchronised.';
        }
        infoEl.textContent = text;
    }

    // Show the recalibrate link.
    const link = getRoot().querySelector(SELECTORS.action('recalibrate'));
    if (link) {
        link.classList.remove('d-none');
    }

    // Refresh adjusted column for any already-displayed results.
    updateAdjustedDisplay();
};

/**
 * Send test events via AJAX web service
 *
 * @param {number} count
 * @param {boolean} useadhoc
 * @param {string} burstid
 * @param {number} delay Delay between events in milliseconds
 * @return {Promise}
 */
const sendTestEvents = (count, useadhoc, burstid, delay) => Ajax.call([{
    methodname: 'tool_realtime_send_test_events',
    args: {count, useadhoc, burstid, delay}
}])[0];

/**
 * Handle receive-single button click
 */
const handleReceiveSingle = async() => {
    const burstid = generateBurstId();
    resetReceiveStats(burstid);
    updateStat('receive-status', 'Sending...');
    showRegion('receive-results');
    try {
        await sendTestEvents(1, false, burstid, 0);
    } catch (err) {
        addReceiveError('Failed to send test event: ' + extractErrorMessage(err));
        updateStat('receive-status', 'Error');
        updateReceiveDisplay();
    }
};

/**
 * Handle receive-burst button click
 */
const handleReceiveBurst = async() => {
    const count = getFieldValue('receive-burst-count');
    const delay = getFieldValue('receive-burst-delay', 0);
    const burstid = generateBurstId();
    resetReceiveStats(burstid);
    receiveStats.expected = count;
    updateStat('receive-status', 'Queued, waiting for cron...');
    updateStat('receive-count', '0 / ' + count);
    updateStat('receive-avg', '—');
    updateStat('receive-minmax', '—');
    updateStat('receive-avg-adjusted', '');
    updateStat('receive-minmax-adjusted', '');
    updateStat('receive-errors', '0');
    hideRegion('receive-error-details');
    showRegion('receive-results');
    showResetButton('receive');
    try {
        await sendTestEvents(count, true, burstid, delay);
        resetReceiveTimeout();
    } catch (err) {
        addReceiveError('Failed to queue burst task: ' + extractErrorMessage(err));
        updateStat('receive-status', 'Error');
        updateReceiveDisplay();
    }
};

/**
 * Validate a push test response from the server
 *
 * Checks that the response contains receivedtime and that the echoed payload
 * matches what was originally sent.
 *
 * @param {Object} response The response from sendToServer
 * @param {Object} sentPayload The payload we originally sent
 * @return {string|null} Error message, or null if valid
 */
const validatePushResponse = (response, sentPayload) => {
    if (!response) {
        return 'Empty response from server';
    }
    if (typeof response.receivedtime === 'undefined') {
        return 'Missing receivedtime in response (got: ' + JSON.stringify(response) + ')';
    }
    if (typeof response.receivedtime !== 'number' || response.receivedtime <= 0) {
        return 'Invalid receivedtime: ' + response.receivedtime;
    }
    if (!response.echo) {
        return 'Server did not echo back the payload';
    }
    // Verify the echoed senttime matches what we sent.
    if (Number(response.echo.senttime) !== sentPayload.senttime) {
        return 'Echoed senttime (' + response.echo.senttime + ') does not match sent value (' + sentPayload.senttime + ')';
    }
    return null;
};

/**
 * Handle push-burst button click
 */
const handlePushBurst = async() => {
    const count = getFieldValue('push-burst-count');
    const delay = getFieldValue('push-burst-delay', 0);
    resetPushStats();
    pushStats.expected = count;
    updateStat('push-status', 'Sending...');
    updateStat('push-count', '0 / ' + count);
    updateStat('push-avg', '—');
    updateStat('push-minmax', '—');
    updateStat('push-errors', '0');
    hideRegion('push-error-details');
    showRegion('push-results');
    showResetButton('push');

    for (let i = 0; i < count; i++) {
        if (i > 0 && delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        const startTime = Date.now();
        const payload = {senttime: startTime, seq: i, total: count};
        try {
            const response = await sendToServer('tool_realtime', payload, true);
            const rtt = Date.now() - startTime;
            const validationError = validatePushResponse(response, payload);

            if (validationError) {
                pushStats.errors++;
                pushStats.errorMessages.push('Event ' + i + ': ' + validationError);
            } else {
                pushStats.count++;
                pushStats.totalRtt += rtt;
                pushStats.min = Math.min(pushStats.min, rtt);
                pushStats.max = Math.max(pushStats.max, rtt);
            }
        } catch (err) {
            pushStats.errors++;
            pushStats.errorMessages.push('Event ' + i + ': ' + extractErrorMessage(err));
        }
        updatePushDisplay();
    }
    updateStat('push-status', pushStats.errors > 0 ? 'Complete (with errors)' : 'Complete');
};

/**
 * Handle receive-reset button click
 */
const handleReceiveReset = () => {
    resetReceiveStats();
    hideRegion('receive-results');
    hideRegion('receive-error-details');
    const el = getRoot().querySelector(SELECTORS.action('receive-reset'));
    if (el) {
        el.classList.add('d-none');
    }
};

/**
 * Handle push-reset button click
 */
const handlePushReset = () => {
    resetPushStats();
    hideRegion('push-results');
    hideRegion('push-error-details');
    const el = getRoot().querySelector(SELECTORS.action('push-reset'));
    if (el) {
        el.classList.add('d-none');
    }
};

/**
 * Initialise the test settings page
 */
export const init = () => {
    // Subscribe to realtime events for the receive test.
    PubSub.subscribe(RealTimeEvents.EVENT, onEventReceived);
    PubSub.subscribe(RealTimeEvents.CONNECTION_LOST, () => {
        addReceiveError('Connection lost');
        updateStat('receive-status', 'Connection lost');
        updateReceiveDisplay();
    });

    // Bind button click handlers.
    const root = getRoot();
    if (!root) {
        return;
    }

    const actions = {
        'receive-single': handleReceiveSingle,
        'receive-burst': handleReceiveBurst,
        'receive-reset': handleReceiveReset,
        'push-burst': handlePushBurst,
        'push-reset': handlePushReset,
        'recalibrate': calibrateClockOffset,
    };

    root.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) {
            return;
        }
        const action = button.dataset.action;
        if (actions[action]) {
            e.preventDefault();
            actions[action]();
        }
    });

    // Run clock offset calibration.
    setTimeout(calibrateClockOffset, 1000);
};
