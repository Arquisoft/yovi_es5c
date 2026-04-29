Feature: Profile editing
  Validate profile updates

  Scenario: Edit profile information
    Given a registered profile user
    And the profile page is open
    When I update the profile with name "Updated" surname "Profile" and email "updated.profile@test.com"
    Then I should see a profile updated confirmation
    And the profile should show name "Updated" surname "Profile" and email "updated.profile@test.com"
