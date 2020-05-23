@tool @tool_realtime @realtimeplugin @realtimeplugin_phppoll
Feature: Testing basic functionality of realtimeplugin_phppoll
  In order to browse effectively
  As a user
  I need to be able to check for updates

  @javascript
  Scenario: Basic test of polling for updates
    Given the following config values are set as admin:
      | realtimeplugin_phppoll/requesttimeout | 1   |
      | realtimeplugin_phppoll/longpollsleep  | 200 |
    When I log in as "admin"
    And I am on realtime fixture page
    Then I wait until "Realtime plugin - phppoll" "text" exists
    And I follow "Test1"
    And I wait until "Received event" "text" exists
    And I should see "Received event for component tool_realtime, area = test, itemid = 0, context id = 5, contextlevel = 30, context instanceid = 2, payload data = 1"
    And I follow "Test2"
    And I wait "2" seconds
    And I should see "Received event for component tool_realtime, area = test, itemid = 0, context id = 5, contextlevel = 30, context instanceid = 2, payload data = 2"
    And I log out
