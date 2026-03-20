//! A greedy bot implementation.
//!
//! This module provides [`GreedyBot`], a bot that chooses the cell that
//! maximizes the number of friendly neighbors, expanding its existing
//! chain as aggressively as possible each turn.
 
use crate::{Coordinates, GameY, PlayerId, YBot};
 
/// A bot that maximizes connections to its own existing pieces.
///
/// For each available cell, `GreedyBot` counts how many of its immediate
/// neighbors are already occupied by the same player. It then picks the
/// cell with the highest count, effectively trying to extend its chain
/// as much as possible on every turn.
///
/// When multiple cells tie for the highest neighbor count (common at the
/// start of the game when the board is empty), the first one found in
/// index order is chosen.
///
pub struct GreedyBot;
 
impl YBot for GreedyBot {
    fn name(&self) -> &str {
        "greedy_bot"
    }
 
    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        let size = board.board_size();
        let my_player = board.next_player()?;
 
        board
            .available_cells()
            .iter()
            .map(|&idx| Coordinates::from_index(idx, size))
            .max_by_key(|coords| count_friendly_neighbors(board, coords, my_player))
    }
}
 
/// Counts how many neighbors of `coords` are occupied by `player`.
///
/// This is the core scoring function of `GreedyBot`. A higher score means
/// the cell is more connected to the player's existing pieces, making it
/// a better candidate for expanding the chain.
fn count_friendly_neighbors(board: &GameY, coords: &Coordinates, player: PlayerId) -> usize {
    board
        .get_neighbors(coords)
        .iter()
        .filter(|neighbor| board.cell_player(neighbor) == Some(player))
        .count()
}