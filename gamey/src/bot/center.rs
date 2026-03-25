//! A center-biased bot implementation.
//!
//! This module provides [`CenterBot`], a bot whose strategy escalates
//! with difficulty.
 
use crate::bot::strategies;
use crate::{Coordinates, GameY, YBot};
 
/// A bot that chooses the available cell closest to the center of the board.
///
/// On a triangular board of size N, the barycentric coordinates of a cell
/// sum to N-1. The "most central" point is where all three coordinates are
/// as equal as possible, i.e. each coordinate is approximately (N-1)/3.
///
/// The bot uses Manhattan distance in barycentric space to measure how far
/// each available cell is from that ideal center point, and picks the closest.
/// Ties are broken by taking the first cell found (lowest index).
///
pub struct CenterBot {
    /// Difficulty level: 1 = easy, 2 = medium, 3 = hard.
    pub level: u8,
}
 
impl YBot for CenterBot {
    fn name(&self) -> &str {
        match self.level {
            1 => "center_bot_1",
            2 => "center_bot_2",
            _ => "center_bot",
        }
    }
 
    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        match self.level {
            1 => strategies::random_move(board),
            2 => strategies::center_move(board),
            _ => strategies::greedy_center_move(board),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Movement, PlayerId};
 
    #[test]
    fn test_center_bot_name_level1() {
        assert_eq!(CenterBot { level: 1 }.name(), "center_bot_1");
    }
 
    #[test]
    fn test_center_bot_name_level2() {
        assert_eq!(CenterBot { level: 2 }.name(), "center_bot_2");
    }
 
    #[test]
    fn test_center_bot_name_level3() {
        assert_eq!(CenterBot { level: 3 }.name(), "center_bot");
    }
 
    #[test]
    fn test_level1_returns_available_cell() {
        // Level 1 juega random — solo comprobamos que la celda es válida
        let bot = CenterBot { level: 1 };
        let game = GameY::new(5);
        let coords = bot.choose_move(&game).unwrap();
        assert!(game.available_cells().contains(&coords.to_index(game.board_size())));
    }
 
    #[test]
    fn test_level2_picks_central_cell_on_size_7() {
        // Level 2 usa center_move — debe elegir (2,2,2) en tablero vacío
        let bot = CenterBot { level: 2 };
        let game = GameY::new(7);
        assert_eq!(bot.choose_move(&game).unwrap(), crate::Coordinates::new(2, 2, 2));
    }
 
    #[test]
    fn test_level3_picks_central_cell_on_empty_board() {
        // Level 3 usa greedy_center — en tablero vacío también elige (2,2,2)
        // porque no hay vecinos propios y el desempate es el centro
        let bot = CenterBot { level: 3 };
        let game = GameY::new(7);
        assert_eq!(bot.choose_move(&game).unwrap(), crate::Coordinates::new(2, 2, 2));
    }
 
    #[test]
    fn test_level3_prefers_friendly_neighbors_over_center() {
        // Level 3 usa greedy_center — con piezas en el tablero debe expandir
        // la cadena aunque eso signifique alejarse del centro
        let bot = CenterBot { level: 3 };
        let mut game = GameY::new(7);
 
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: crate::Coordinates::new(0, 5, 1),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: crate::Coordinates::new(6, 0, 0),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: crate::Coordinates::new(0, 4, 2),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: crate::Coordinates::new(5, 1, 0),
        }).unwrap();
 
        let chosen = bot.choose_move(&game).unwrap();
        // Debe haber elegido una celda con al menos 1 vecino propio
        let friendly = strategies::count_friendly_neighbors(
            &game, &chosen, PlayerId::new(0)
        );
        assert!(friendly >= 1,
            "Level 3 debería expandir la cadena, eligió {:?} con {} vecinos propios",
            chosen, friendly
        );
    }
 
    #[test]
    fn test_returns_none_on_full_board() {
        for level in 1..=3 {
            let bot = CenterBot { level };
            let mut game = GameY::new(2);
            let moves = vec![
                Movement::Placement { player: PlayerId::new(0), coords: crate::Coordinates::new(1, 0, 0) },
                Movement::Placement { player: PlayerId::new(1), coords: crate::Coordinates::new(0, 1, 0) },
                Movement::Placement { player: PlayerId::new(0), coords: crate::Coordinates::new(0, 0, 1) },
            ];
            for mv in moves { game.add_move(mv).unwrap(); }
            assert!(bot.choose_move(&game).is_none(),
                "Level {} debería devolver None en tablero lleno", level);
        }
    }
 
    #[test]
    fn test_all_levels_return_available_cell() {
        for level in 1..=3 {
            let bot = CenterBot { level };
            let game = GameY::new(5);
            let coords = bot.choose_move(&game).unwrap();
            let idx = coords.to_index(game.board_size());
            assert!(game.available_cells().contains(&idx),
                "Level {} eligió celda no disponible", level);
        }
    }
}