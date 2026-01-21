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

    if ($oldversion < 2024080101) {
        // Define table realtimeplugin_phppoll to be dropped.
        $table = new xmldb_table('realtimeplugin_phppoll');

        // Conditionally launch drop table for realtimeplugin_phppoll.
        if ($dbman->table_exists($table)) {
            $dbman->drop_table($table);
        }

        // Define table realtimeplugin_phppoll to be created.
        $table = new xmldb_table('realtimeplugin_phppoll');

        // Adding fields to table realtimeplugin_phppoll.
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('hash', XMLDB_TYPE_CHAR, '32', null, XMLDB_NOTNULL, null, null);
        $table->add_field('contextid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('component', XMLDB_TYPE_CHAR, '255', null, null, null, null);
        $table->add_field('area', XMLDB_TYPE_CHAR, '255', null, null, null, null);
        $table->add_field('itemid', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('channeldetails', XMLDB_TYPE_CHAR, '100', null, XMLDB_NOTNULL, null, null);
        $table->add_field('payload', XMLDB_TYPE_TEXT, null, null, null, null, null);
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('timemodified', XMLDB_TYPE_INTEGER, '10', null, null, null, null);

        // Adding keys to table realtimeplugin_phppoll.
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);

        // Adding indexes to table realtimeplugin_phppoll.
        $table->add_index('timecreated', XMLDB_INDEX_NOTUNIQUE, ['timecreated']);
        $table->add_index('hashid', XMLDB_INDEX_NOTUNIQUE, ['hash', 'id']);

        // Conditionally launch create table for realtimeplugin_phppoll.
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        // Phppoll savepoint reached.
        upgrade_plugin_savepoint(true, 2024080101, 'realtimeplugin', 'phppoll');
    }

    return true;
}
