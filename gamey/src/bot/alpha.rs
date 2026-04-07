//! This module provides [`AlphaBetaBot`], a bot that uses minimax search
//! with alpha-beta pruning to choose the best move.

use crate::bot::strategies;
use crate::{Coordinates, GameY, YBot};

pub struct AlphaBot {
    /// Difficulty level: 1 = easy, 2 = medium, 3 = hard.
    pub level: u8,
}

impl YBot for AlphaBot {
    fn name(&self) -> &str {
        match self.level {
            1 => "alpha_bot_1",
            2 => "alpha_bot_2",
            _ => "alpha_bot",
        }
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        match self.level {
            // Nivel 1: profundidad 1 — solo mira un movimiento hacia adelante
            1 => strategies::alpha_beta_move(board, 1),
            // Nivel 2: profundidad 2 — mira nuestra jugada + respuesta del rival
            2 => strategies::alpha_beta_move(board, 3),
            // Nivel 3: profundidad 4 — balance entre fuerza y velocidad
            _ => strategies::alpha_beta_move(board, 4),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Coordinates, Movement, PlayerId};
 
 
    #[test]
    fn test_name_level1() {
        assert_eq!(AlphaBot { level: 1 }.name(), "alpha_bot_1");
    }
 
    #[test]
    fn test_name_level2() {
        assert_eq!(AlphaBot { level: 2 }.name(), "alpha_bot_2");
    }
 
    #[test]
    fn test_name_level3() {
        assert_eq!(AlphaBot { level: 3 }.name(), "alpha_bot");
    }
  
    #[test]
    fn test_all_levels_return_move_on_empty_board() {
        let game = GameY::new(5);
        for level in 1..=3 {
            assert!(
                AlphaBot { level }.choose_move(&game).is_some(),
                "level {} returned None on empty board", level
            );
        }
    }
 
    #[test]
    fn test_all_levels_return_none_on_full_board() {
        for level in 1..=3 {
            let bot = AlphaBot { level };
            let mut game = GameY::new(2);
            let moves = vec![
                Movement::Placement { player: PlayerId::new(0), coords: Coordinates::new(1, 0, 0) },
                Movement::Placement { player: PlayerId::new(1), coords: Coordinates::new(0, 1, 0) },
                Movement::Placement { player: PlayerId::new(0), coords: Coordinates::new(0, 0, 1) },
            ];
            for mv in moves { game.add_move(mv).unwrap(); }
            assert!(
                bot.choose_move(&game).is_none(),
                "level {} should return None on a full board", level
            );
        }
    }
 
    #[test]
    fn test_all_levels_return_available_cell() {
        let game = GameY::new(5);
        for level in 1..=3 {
            let coords = AlphaBot { level }.choose_move(&game).unwrap();
            let idx = coords.to_index(game.board_size());
            assert!(
                game.available_cells().contains(&idx),
                "level {} chose an unavailable cell", level
            );
        }
    }

}