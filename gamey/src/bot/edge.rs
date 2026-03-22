//! An edge-seeking bot implementation with difficulty levels.
//!
//! This module provides [`EdgeBot`], a bot that prioritizes cells touching
//! the sides of the triangular board, using the number of sides touched
//! as the primary score, and proximity to center as a tiebreaker.

use crate::bot::strategies;
use crate::{Coordinates, GameY, YBot};

pub struct EdgeBot {
    /// Difficulty level: 1 = easy, 2 = medium, 3 = hard.
    pub level: u8,
}

impl YBot for EdgeBot {
    fn name(&self) -> &str {
        match self.level {
            1 => "edge_bot_1",
            2 => "edge_bot_2",
            _ => "edge_bot",
        }
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        match self.level {
            1 => strategies::random_move(board),
            2 => strategies::edge_move(board),
            _ => strategies::edge_move(board),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Movement, PlayerId};

    #[test]
    fn test_edge_bot_name_level3() {
        assert_eq!(EdgeBot { level: 3 }.name(), "edge_bot");
    }

    #[test]
    fn test_edge_bot_name_level2() {
        assert_eq!(EdgeBot { level: 2 }.name(), "edge_bot_2");
    }

    #[test]
    fn test_edge_bot_name_level1() {
        assert_eq!(EdgeBot { level: 1 }.name(), "edge_bot_1");
    }

    #[test]
    fn test_edge_bot_returns_move_on_empty_board() {
        let bot = EdgeBot { level: 3 };
        let game = GameY::new(5);
        assert!(bot.choose_move(&game).is_some());
    }

    #[test]
    fn test_edge_bot_returns_none_on_full_board() {
        for level in 1..=3 {
            let bot = EdgeBot { level };
            let mut game = GameY::new(2);
            let moves = vec![
                Movement::Placement {
                    player: PlayerId::new(0),
                    coords: Coordinates::new(1, 0, 0),
                },
                Movement::Placement {
                    player: PlayerId::new(1),
                    coords: Coordinates::new(0, 1, 0),
                },
                Movement::Placement {
                    player: PlayerId::new(0),
                    coords: Coordinates::new(0, 0, 1),
                },
            ];
            for mv in moves {
                game.add_move(mv).unwrap();
            }
            assert!(bot.choose_move(&game).is_none());
        }
    }

    #[test]
    fn test_edge_bot_prefers_border_cell() {
        for level in 2..=3 {
            let bot = EdgeBot { level };
            let game = GameY::new(7);
            let coords = bot.choose_move(&game).unwrap();
            assert!(
                coords.touches_side_a() || coords.touches_side_b() || coords.touches_side_c(),
                "EdgeBot eligió celda interior {:?}",
                coords
            );
        }
    }
}
