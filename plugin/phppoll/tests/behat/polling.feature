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
    And I wait until "Pushed Test1" "text" exists
    And I wait "3" seconds
    And I wait "3" seconds
    And I wait "3" seconds
    And I wait "3" seconds
    And I wait until "Received event for component tool_realtime" "text" exists
    And I should see "payload data = 1"
    And I follow "Test2"
    And I wait until "payload data = 2" "text" exists
    And I log out
