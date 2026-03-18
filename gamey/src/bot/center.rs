//! A center-biased bot implementation.
//!
//! This module provides [`CenterBot`], a bot that prioritizes cells closer
//! to the center of the triangular board.
//!
//! In the Game of Y, central cells are strategically superior because they
//! have more neighbors (up to 6) and are equidistant from all three sides,
//! making it easier to build a chain that eventually touches all three sides.
 
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
pub struct CenterBot;
 
impl YBot for CenterBot {
    fn name(&self) -> &str {
        "center_bot"
    }
 
    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        let size = board.board_size();
 
        // The ideal center in barycentric coordinates is the point where
        // x == y == z == (N-1) / 3. Since N-1 may not be divisible by 3,
        // we work with the raw sum (N-1) and measure distance as how far
        // each coordinate deviates from the perfect third.
        //
        // We use u32 arithmetic throughout to avoid casting.
        // The center target for each axis is (size - 1) / 3.
        let target = (size - 1) / 3;
 
        board
            .available_cells()
            .iter()
            .map(|&idx| Coordinates::from_index(idx, size))
            .min_by_key(|coords| {
                // Manhattan distance in barycentric space:
                // sum of absolute differences between each coordinate and the target.
                //
                // Because u32 has no signed subtraction, we use abs_diff which
                // computes |a - b| safely for unsigned integers.
                coords.x().abs_diff(target)
                    + coords.y().abs_diff(target)
                    + coords.z().abs_diff(target)
            })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Movement, PlayerId};
 
    #[test]
    fn test_center_bot_name() {
        let bot = CenterBot;
        assert_eq!(bot.name(), "center_bot");
    }
 
    #[test]
    fn test_center_bot_returns_move_on_empty_board() {
        let bot = CenterBot;
        let game = GameY::new(5);
        assert!(bot.choose_move(&game).is_some());
    }
 
    #[test]
    fn test_center_bot_returns_none_on_full_board() {
        let bot = CenterBot;
        let mut game = GameY::new(2);
 
        // Un tablero de tamaño 2 tiene 3 celdas: (1,0,0), (0,1,0), (0,0,1)
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
 
        assert!(game.available_cells().is_empty());
        assert!(bot.choose_move(&game).is_none());
    }
 
    #[test]
    fn test_center_bot_picks_central_cell_on_size_3() {
        // En un tablero de tamaño 3, N-1 = 2, target = 0.
        // Las celdas son: (2,0,0), (1,1,0), (1,0,1), (0,2,0), (0,1,1), (0,0,2)
        // La celda más central es (0,1,1) porque tiene distancia:
        //   |0-0| + |1-0| + |1-0| = 2
        // Pero la que tiene distancia mínima real es la que tenga x+y+z = 2
        // con cada coordenada lo más parecida posible a 2/3 ≈ 0.
        // Con target=0 la celda (0,1,1) tiene distancia 0+1+1=2.
        // (1,1,0) tiene distancia 1+1+0=2. (1,0,1) tiene distancia 1+0+1=2.
        // Todas las celdas no-esquina tienen la misma distancia 2.
        // Las esquinas tienen distancia 4: (2,0,0) -> 2+0+0=2, espera...
        // (2,0,0): |2-0|+|0-0|+|0-0| = 2. Igual que las demás con target=0.
        // En size=3 todas tienen la misma distancia, se coge la primera.
        let bot = CenterBot;
        let game = GameY::new(3);
        let result = bot.choose_move(&game);
        assert!(result.is_some());
        let coords = result.unwrap();
        // La celda elegida debe ser una celda válida del tablero
        assert_eq!(coords.x() + coords.y() + coords.z(), 2);
    }
 
    #[test]
    fn test_center_bot_picks_central_cell_on_size_7() {
        // En un tablero de tamaño 7, N-1 = 6, target = 2.
        // La celda más central es (2,2,2) con distancia 0.
        let bot = CenterBot;
        let game = GameY::new(7);
        let coords = bot.choose_move(&game).unwrap();
        assert_eq!(coords, Coordinates::new(2, 2, 2));
    }
 
    #[test]
    fn test_center_bot_avoids_occupied_cells() {
        let bot = CenterBot;
        let mut game = GameY::new(7);
 
        // Ocupamos la celda central perfecta (2,2,2)
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(2, 2, 2),
        })
        .unwrap();
 
        let coords = bot.choose_move(&game).unwrap();
 
        // La celda elegida no debe ser la ya ocupada
        assert_ne!(coords, Coordinates::new(2, 2, 2));
 
        // Y debe ser una celda disponible
        let idx = coords.to_index(game.board_size());
        assert!(game.available_cells().contains(&idx));
    }
 
    #[test]
    fn test_center_bot_chosen_cell_is_always_available() {
        let bot = CenterBot;
        let mut game = GameY::new(5);
 
        // Hacemos varios movimientos y comprobamos que el bot siempre elige
        // una celda disponible
        for turn in 0..6 {
            let player = PlayerId::new(turn % 2);
            if let Some(coords) = bot.choose_move(&game) {
                let idx = coords.to_index(game.board_size());
                assert!(
                    game.available_cells().contains(&idx),
                    "CenterBot eligió una celda no disponible en el turno {}",
                    turn
                );
                game.add_move(Movement::Placement { player, coords }).unwrap();
            }
        }
    }
}