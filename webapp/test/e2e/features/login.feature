Feature: Login
  Validate the login form

  Scenario: Successful login
    Given the login page is open
    When I enter "Alice" as the username and "Alice123**" as the password and submit the login
    Then I should be redirected and see a paragraph containing "You are in as"

  Scenario: Login with wrong password
    Given the login page is open
    When I enter "Alice" as the username and "wrongpassword" as the password and submit the login
    Then I should see an error message containing "Incorrect"

  Scenario: Login with unregistered user
    Given the login page is open
    When I enter "UnregisteredUser" as the username and "somepassword" as the password and submit the login
    Then I should see an error message containing "Incorrect"