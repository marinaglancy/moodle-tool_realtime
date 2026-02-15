@tool @tool_realtime @javascript
Feature: Management of real time backend plugins
  In order to configure real time events
  As an admin
  I need to be able to manage real time backend plugins and test settings

  Scenario: View the plugin management page and test settings link
    Given I log in as "admin"
    When I navigate to "Plugins > Admin tools > Real time events" in site administration
    Then I should see "Available real time backend plugins"
    And I should see "PHP polling"
    And I should see "Test settings" in the "#realtimeplugins" "css_element"
    And I click on "Test settings" "link" in the "#realtimeplugins" "css_element"
    And I should see "PHP polling. Test settings"
    And I should see "Event delivery (server to browser)"
    And I should see "Event push (browser to server)"
    And "Receive single event" "button" should exist
    And "Receive multiple events" "button" should exist
    And "Send to server" "button" should exist

  Scenario: Receive a single event from the server
    Given I log in as "admin"
    And I navigate to "Plugins > Admin tools > Real time events" in site administration
    And I click on "Test settings" "link" in the "#realtimeplugins" "css_element"
    When I click on "Receive single event" "button"
    And I wait "1" seconds
    And I should see "Complete" in the "[data-stat='receive-status']" "css_element"
    Then the following should exist in the "Event delivery results" table:
      | -1-              | -2-      |
      | Status           | Complete |
      | Events received  | 1 / 1   |
      | Errors           | 0        |

  Scenario: Receive multiple events from the server via ad-hoc task
    Given I log in as "admin"
    And I navigate to "Plugins > Admin tools > Real time events" in site administration
    And I click on "Test settings" "link" in the "#realtimeplugins" "css_element"
    And I set the field "receive-burst-count" to "3"
    And I set the field "receive-burst-delay" to "200"
    When I click on "Receive multiple events" "button"
    And I run all adhoc tasks
    And I wait "1" seconds
    And I should see "Complete" in the "[data-stat='receive-status']" "css_element"
    Then the following should exist in the "Event delivery results" table:
      | -1-              | -2-      |
      | Status           | Complete |
      | Events received  | 3 / 3    |
      | Errors           | 0        |

  Scenario: Send a single event to the server
    Given I log in as "admin"
    And I navigate to "Plugins > Admin tools > Real time events" in site administration
    And I click on "Test settings" "link" in the "#realtimeplugins" "css_element"
    When I click on "Send to server" "button"
    And I wait "1" seconds
    And I should see "Complete" in the "[data-stat='push-status']" "css_element"
    Then the following should exist in the "Event push results" table:
      | -1-         | -2-      |
      | Status      | Complete |
      | Events sent | 1 / 1    |
      | Errors      | 0        |
