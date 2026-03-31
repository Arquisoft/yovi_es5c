use crate::bot::strategies;
use crate::{Coordinates, GameY, YBot};

/// A bot that plays by mirroring the opponent's moves, with 3 difficulty levels.
pub struct MirrorBot {
    /// Difficulty level: 1 = Easy, 2 = Medium, 3 = Hard.
    pub level: u8,
}

impl YBot for MirrorBot {
    /// Returns the internal identifier of the bot based on its level.
    fn name(&self) -> &str {
        match self.level {
            1 => "mirror_bot_1",
            2 => "mirror_bot_2",
            _ => "mirror_bot", // Level 3 is the default "hard" bot
        }
    }

    /// Chooses a move based on the difficulty level.
    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        match self.level {
            // Level 1: Always random
            1 => strategies::random_move(board),
            
            // Level 2: 50% chance to mirror, 50% chance to be random
            2 => {
                if rand::random::<f64>() < 0.5 {
                    strategies::mirror_move(board).or_else(|| strategies::random_move(board))
                } else {
                    strategies::random_move(board)
                }
            },

            // Level 3: Pure Mirror Strategy with center fallback
            _ => strategies::mirror_move(board)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Movement, PlayerId};

    #[test]
    fn test_mirror_bot_names_by_level() {
        assert_eq!(MirrorBot { level: 1 }.name(), "mirror_bot_1");
        assert_eq!(MirrorBot { level: 2 }.name(), "mirror_bot_2");
        assert_eq!(MirrorBot { level: 3 }.name(), "mirror_bot");
    }

    #[test]
    fn test_level3_mirrors_opponent() {
        let bot = MirrorBot { level: 3 };
        let mut game = GameY::new(5);
        let player_move = Coordinates::new(4, 0, 0); // Top corner

        // Simulate human move
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: player_move,
        }).unwrap();

        let bot_choice = bot.choose_move(&game).unwrap();
        // Should be (0, 0, 4) or (0, 4, 0)
        let expected_1 = Coordinates::new(0, 0, 4);
        let expected_2 = Coordinates::new(0, 4, 0);
        
        assert!(bot_choice == expected_1 || bot_choice == expected_2);
    }

    #[test]
    fn test_mirror_bot_fallback_to_center_on_empty_board() {
        let bot = MirrorBot { level: 3 };
        let game = GameY::new(7); // Target center is (2,2,2)
        
        let choice = bot.choose_move(&game).unwrap();
        assert_eq!(choice, Coordinates::new(2, 2, 2));
    }
}