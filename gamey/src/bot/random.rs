//! A random bot implementation with difficulty levels.
//!
//! - Level 1 (easy):   always random
//! - Level 2 (medium): always random
//! - Level 3 (hard):   50% random, 50% greedy

use crate::bot::strategies;
use crate::{Coordinates, GameY, YBot};

pub struct RandomBot {
    /// Difficulty level: 1 = easy, 2 = medium, 3 = hard.
    pub level: u8,
}


impl YBot for RandomBot {
    fn name(&self) -> &str {
        match self.level {
            1 => "random_bot_1",
            2 => "random_bot_2",
            _ => "random_bot",
        }
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        match self.level {
            1 | 2 => strategies::random_move(board),
            _ => {
                // 50% random, 50% greedy
                if rand::random::<f64>() < 0.5 {
                    strategies::random_move(board)
                } else {
                    strategies::greedy_move(board)
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Movement, PlayerId};

    #[test]
    fn test_random_bot_name_level1() {
        assert_eq!(RandomBot { level: 1 }.name(), "random_bot_1");
    }

    #[test]
    fn test_random_bot_name_level2() {
        assert_eq!(RandomBot { level: 2 }.name(), "random_bot_2");
    }

    #[test]
    fn test_random_bot_name_level3() {
        assert_eq!(RandomBot { level: 3 }.name(), "random_bot");
    }

    #[test]
    fn test_all_levels_return_move_on_empty_board() {
        let game = GameY::new(5);
        for level in 1..=3 {
            assert!(RandomBot { level }.choose_move(&game).is_some(),
                "nivel {} devolvió None en tablero vacío", level);
        }
    }

    #[test]
    fn test_all_levels_return_none_on_full_board() {
        let mut game = GameY::new(2);
        let moves = vec![
            Movement::Placement { player: PlayerId::new(0), coords: crate::Coordinates::new(1, 0, 0) },
            Movement::Placement { player: PlayerId::new(1), coords: crate::Coordinates::new(0, 1, 0) },
            Movement::Placement { player: PlayerId::new(0), coords: crate::Coordinates::new(0, 0, 1) },
        ];
        for mv in moves { game.add_move(mv).unwrap(); }
        for level in 1..=3 {
            assert!(RandomBot { level }.choose_move(&game).is_none(),
                "nivel {} debería devolver None en tablero lleno", level);
        }
    }

    #[test]
    fn test_all_levels_return_available_cell() {
        let game = GameY::new(5);
        for level in 1..=3 {
            let coords = RandomBot { level }.choose_move(&game).unwrap();
            let idx = coords.to_index(game.board_size());
            assert!(game.available_cells().contains(&idx),
                "nivel {} eligió celda no disponible", level);
        }
    }
}