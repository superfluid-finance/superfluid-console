Feature: Token page test cases

  Scenario: Data displayed in network governance tokens page
    Given User has opened the "landing" page
    And User clicks on the tokens button
    And User switches network for "optimism-sepolia" and validates data
    Then User filters super tokens by name for "optimism-sepolia"
    Then User filters super tokens by symbol for "optimism-sepolia"
    Then User filters super tokens by listed
    Then User filters super tokens by not listed


