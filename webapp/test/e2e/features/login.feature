Feature: Login
  Validate the login form

  Scenario: Successful login
    Given a registered user "AliceLogin" with password "Alice123**"
    And the login page is open
    When I enter "AliceLogin" as the username and "Alice123**" as the password and submit the login
    Then I should be redirected and see a paragraph containing "Welcome back, AliceLogin"

  Scenario: Login with wrong password
    Given a registered user "AliceWrong" with password "Alice123**"
    And the login page is open
    When I enter "AliceWrong" as the username and "wrongpassword" as the password and submit the login
    Then I should see an error message containing "Incorrect"

  Scenario: Login with unregistered user
    Given the login page is open
    When I enter "UnregisteredUser" as the username and "somepassword" as the password and submit the login
    Then I should see an error message containing "Incorrect"