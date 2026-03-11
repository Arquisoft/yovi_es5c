Feature: Registering a new user

Scenario: The user is not registered in the site
  Given An unregistered user
  When I fill the data in the form and press submit
  Then I should be redirect to the homepage

Scenario: Register with existing username
  Given a registered user "AliceReg" with password "Alice123**"
  And the register page is open
  When I fill the form with an already registered username "AliceReg" and password "Alice123**"
  Then I should see an error message containing "User already exists"