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
            _ => strategies::mirror_move(board).or_else(|| strategies::center_move(board)),
        }
    }
}