Feature: Player vs Player game
  Validate a local player vs player game

  Scenario: Start a Player vs Player game and finish with Player 1 winning
    Given a logged in game player
    And a small board size is selected
    And the game setup page is open
    When I start a Player vs Player game
    Then I should see the Player vs Player board
    And it should be Player 1 turn
    When Player 1 places a piece on cell "2-0"
    Then it should be Player 2 turn
    When Player 2 places a piece on cell "0-0"
    Then it should be Player 1 turn
    When Player 1 places a piece on cell "2-1"
    Then it should be Player 2 turn
    When Player 2 places a piece on cell "1-1"
    Then it should be Player 1 turn
    When Player 1 places a piece on cell "2-2"
    Then Player 1 should win the game
