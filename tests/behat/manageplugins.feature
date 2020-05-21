@tool @tool_realtime
Feature: Management of real time backend plugins
  In order to configure real time events
  As an admin
  I need to be able to manage real time backend plugins

  Scenario: View the user page when only the legacy log reader is enabled
    Given I log in as "admin"
    When I navigate to "Plugins > Admin tools > Real time events" in site administration
    Then I should see "Available real time backend plugins"
    And I should see "PHP polling"
    And I log out
