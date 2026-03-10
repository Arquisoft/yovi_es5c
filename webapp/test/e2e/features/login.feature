Feature: Login
  Validate the login form

  Scenario: Successful login
    Given the login page is open
    When I enter "Alice" as the username and "Alice123**" as the password and submit the login
    Then I should be redirected and see a paragraph containing "You are in as"