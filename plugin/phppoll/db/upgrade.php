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
 * Upgrade steps for PHP polling
 *
 * Documentation: {@link https://moodledev.io/docs/guides/upgrade}
 *
 * @package    realtimeplugin_phppoll
 * @category   upgrade
 * @copyright  2024 Marina Glancy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Execute the plugin upgrade steps from the given old version.
 *
 * @param int $oldversion
 * @return bool
 */
function xmldb_realtimeplugin_phppoll_upgrade($oldversion) {
    global $DB;
    $dbman = $DB->get_manager();

    if ($oldversion < 2024073100) {

        $DB->delete_records('realtimeplugin_phppoll');

        // Define field hash to be added to realtimeplugin_phppoll.
        $table = new xmldb_table('realtimeplugin_phppoll');
        $field = new xmldb_field('hash', XMLDB_TYPE_CHAR, '32', null, XMLDB_NOTNULL, null, null, 'id');

        // Conditionally launch add field hash.
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Define field channel to be added to realtimeplugin_phppoll.
        $table = new xmldb_table('realtimeplugin_phppoll');
        $field = new xmldb_field('channel', XMLDB_TYPE_CHAR, '100', null, XMLDB_NOTNULL, null, null, 'itemid');

        // Conditionally launch add field channel.
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Define index hash (not unique) to be added to realtimeplugin_phppoll.
        $table = new xmldb_table('realtimeplugin_phppoll');
        $index = new xmldb_index('hash', XMLDB_INDEX_NOTUNIQUE, ['hash']);

        // Conditionally launch add index hash.
        if (!$dbman->index_exists($table, $index)) {
            $dbman->add_index($table, $index);
        }

        // Phppoll savepoint reached.
        upgrade_plugin_savepoint(true, 2024073100, 'realtimeplugin', 'phppoll');
    }

    return true;
}
