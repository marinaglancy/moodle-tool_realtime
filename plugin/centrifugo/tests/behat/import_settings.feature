@realtimeplugin @realtimeplugin_centrifugo @javascript
Feature: Import Centrifugo settings from configuration
  As an admin
  I want to import Centrifugo settings from configuration files
  So that I can quickly set up the plugin

  Background:
    Given the following config values are set as admin:
      | name    | value      | plugin        |
      | enabled | centrifugo | tool_realtime |
    And I log in as "admin"
    And I navigate to "Plugins > Admin tools > Real time events > Centrifugo" in site administration

  Scenario: Import invalid configuration shows error
    When I click on "Import from configuration" "button"
    And I set the field "centrifugo-import-textarea" to "this is not a valid config"
    And I click on "Import from configuration" "button" in the "Import settings" "dialogue"
    Then I should see "Could not parse the configuration." in the "Import settings" "dialogue"
    And I click on "Cancel" "button" in the "Import settings" "dialogue"

  Scenario: Import from Centrifugo JSON configuration
    When I import centrifugo settings from "centrifugo.json" fixture
    And I press "Save changes"
    Then the field "HTTP API key" matches value "cfgo-http-api-key"
    And the field "Token HMAC secret" matches value "cfgo-hmac-secret-key"
    And the field "Webhook key" matches value "cfgo-webhook-key"

  Scenario: Import from Railway JSON variables
    When I import centrifugo settings from "railway.json" fixture
    And I press "Save changes"
    Then the field "HTTP API key" matches value "rail-http-api-key"
    And the field "Token HMAC secret" matches value "rail-hmac-secret-key"
    And the field "Webhook key" matches value "rail-webhook-key"

  Scenario: Import from Railway .env format
    When I import centrifugo settings from "railway.env" fixture
    And I press "Save changes"
    Then the field "HTTP API key" matches value "env-http-api-key"
    And the field "Token HMAC secret" matches value "env-hmac-secret-key"
    And the field "Webhook key" matches value "env-webhook-key"
