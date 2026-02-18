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
 * Behat steps for realtimeplugin_centrifugo
 *
 * @package    realtimeplugin_centrifugo
 * @category   test
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// NOTE: no MOODLE_INTERNAL test here, this file may be required by behat before including /config.php.

require_once(__DIR__ . '/../../../../../../../lib/behat/behat_base.php');

/**
 * Behat steps for realtimeplugin_centrifugo
 *
 * @package    realtimeplugin_centrifugo
 * @copyright  Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class behat_realtimeplugin_centrifugo extends behat_base {
    /**
     * Import centrifugo settings from a fixture file.
     *
     * Clicks the import button, pastes fixture contents into the modal textarea,
     * and clicks Import.
     *
     * @When I import centrifugo settings from :fixture fixture
     * @param string $fixture Fixture filename (e.g. "centrifugo.json")
     */
    public function i_import_centrifugo_settings_from_fixture(string $fixture): void {
        global $CFG;
        $path = $CFG->dirroot . '/admin/tool/realtime/plugin/centrifugo/tests/fixtures/' . $fixture;
        if (!file_exists($path)) {
            throw new \coding_exception("Fixture file not found: {$path}");
        }
        $content = file_get_contents($path);

        // Click the import button.
        $this->execute('behat_general::i_click_on', [
            get_string('importbutton', 'realtimeplugin_centrifugo'), 'button',
        ]);

        // Wait for the modal to appear and set the textarea value.
        $this->execute('behat_general::wait_until_the_page_is_ready');
        $textarea = $this->find('css', '#centrifugo-import-textarea');
        $textarea->setValue($content);

        // Click Import in the modal.
        $this->execute('behat_general::i_click_on_in_the', [
            get_string('importbutton', 'realtimeplugin_centrifugo'), 'button',
            get_string('importtitle', 'realtimeplugin_centrifugo'), 'dialogue',
        ]);

        // Wait for the modal to close.
        $this->execute('behat_general::wait_until_the_page_is_ready');
    }
}
