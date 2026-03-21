//! A greedy bot with central tiebreaking.
//!
//! This module provides [`GreedyCenterBot`], a bot that combines two strategies:
//! - Primary criterion: maximize connections to friendly pieces (greedy)
//! - Tiebreaker: prefer cells closer to the center of the board (center)
//!
//! This solves the main weakness of [`GreedyBot`]: when the board is empty
//! or a cell has no friendly neighbors, instead of picking the last cell
//! found (a corner), it falls back to the central strategy.
 
use crate::{Coordinates, GameY, PlayerId, YBot};
 
/// A bot that maximizes friendly connections, breaking ties by proximity to center.
///
/// The scoring function combines two criteria into a single tuple `(greedy, center)`:
///
/// - `greedy`: number of friendly neighbors — higher is better
/// - `center`: `u32::MAX - distance_to_center` — higher means closer to center
///
/// Rust compares tuples lexicographically, so `greedy` is always the primary
/// criterion. The center score only matters when two cells have the same
/// number of friendly neighbors.
///
pub struct GreedyCenterBot;
 
impl YBot for GreedyCenterBot {
    fn name(&self) -> &str {
        "greedy_center_bot"
    }
 
    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        let size = board.board_size();
        let my_player = board.next_player()?;
        let target = (size - 1) / 3;
 
        board
            .available_cells()
            .iter()
            .map(|&idx| Coordinates::from_index(idx, size))
            .max_by_key(|coords| {
                // Criterio primario: vecinos propios (maximizar)
                let friendly = count_friendly_neighbors(board, coords, my_player);
 
                // Criterio secundario: distancia al centro (minimizar)
                // Invertimos restando de u32::MAX para que max_by_key
                // interprete "menos distancia" como "mayor valor"
                let dist = coords.x().abs_diff(target)
                    + coords.y().abs_diff(target)
                    + coords.z().abs_diff(target);
                let center_score = u32::MAX - dist;
 
                (friendly as u32, center_score)
            })
    }
}

/// Counts how many neighbors of `coords` are occupied by `player`.
fn count_friendly_neighbors(board: &GameY, coords: &Coordinates, player: PlayerId) -> usize {
    board
        .get_neighbors(coords)
        .iter()
        .filter(|neighbor| board.cell_player(neighbor) == Some(player))
        .count()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Movement, PlayerId};
 
    #[test]
    fn test_greedy_center_bot_name() {
        let bot = GreedyCenterBot;
        assert_eq!(bot.name(), "greedy_center_bot");
    }
 
    #[test]
    fn test_greedy_center_bot_returns_move_on_empty_board() {
        let bot = GreedyCenterBot;
        let game = GameY::new(5);
        assert!(bot.choose_move(&game).is_some());
    }
 
    #[test]
    fn test_greedy_center_bot_returns_none_on_full_board() {
        let bot = GreedyCenterBot;
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
 
        assert!(game.available_cells().is_empty());
        assert!(bot.choose_move(&game).is_none());
    }
 
    #[test]
    fn test_empty_board_falls_back_to_center_on_size_7() {
        // En tablero vacío no hay vecinos propios, todas las celdas tienen
        // greedy=0. El desempate central debe elegir (2,2,2), igual que CenterBot.
        let bot = GreedyCenterBot;
        let game = GameY::new(7);
        let coords = bot.choose_move(&game).unwrap();
        assert_eq!(coords, Coordinates::new(2, 2, 2));
    }
 
    #[test]
    fn test_prefers_cell_with_more_friendly_neighbors_over_center() {
        // Aunque haya una celda más central, el bot debe preferir
        // la que tiene más vecinos propios.
        let bot = GreedyCenterBot;
        let mut game = GameY::new(7);
 
        // Jugador 0 coloca dos piezas alejadas del centro
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(0, 5, 1),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(6, 0, 0),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(0, 4, 2),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(5, 1, 0),
        }).unwrap();
 
        // Ahora hay celdas vecinas a las piezas del jugador 0.
        // El bot debe elegir una de ellas aunque estén lejos del centro.
        let chosen = bot.choose_move(&game).unwrap();
        let friendly_score = count_friendly_neighbors(
            &game,
            &chosen,
            PlayerId::new(0),
        );
        assert!(
            friendly_score >= 1,
            "Debería elegir una celda con al menos 1 vecino propio, eligió {:?} con score {}",
            chosen, friendly_score
        );
    }
 
    #[test]
    fn test_chosen_cell_always_available() {
        let bot = GreedyCenterBot;
        let mut game = GameY::new(7);
 
        for turn in 0..10 {
            let player = PlayerId::new(turn % 2);
            if let Some(coords) = bot.choose_move(&game) {
                let idx = coords.to_index(game.board_size());
                assert!(
                    game.available_cells().contains(&idx),
                    "GreedyCenterBot eligió celda no disponible en turno {}",
                    turn
                );
                game.add_move(Movement::Placement { player, coords }).unwrap();
            }
        }
    }
 
    #[test]
    fn test_valid_coordinates() {
        let bot = GreedyCenterBot;
        let game = GameY::new(7);
        let coords = bot.choose_move(&game).unwrap();
        assert_eq!(coords.x() + coords.y() + coords.z(), 6);
    }
}