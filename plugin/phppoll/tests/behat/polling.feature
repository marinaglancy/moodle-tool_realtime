@realtimeplugin @realtimeplugin_phppoll
Feature: Testing basic functionality of realtimeplugin_phppoll
  In order to browse effectively
  As a user
  I need to be able to check for updates

  @javascript
  Scenario: Basic test of polling for updates
    Given I log in as "admin"
    When I am on realtime fixture page
    And I wait "2" seconds
    And I should see "Realtime is enabled - phppoll"
    And I follow "Test1"
    And I wait "2" seconds
    And I should see "Received event for component tool_realtime, area = test, itemid = 0, context id = 5, contextlevel = 30, context instanceid = 2, payload data = 1"
    And I follow "Test2"
    And I wait "2" seconds
    And I should see "Received event for component tool_realtime, area = test, itemid = 0, context id = 5, contextlevel = 30, context instanceid = 2, payload data = 2"
    And I log out
