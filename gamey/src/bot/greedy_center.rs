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