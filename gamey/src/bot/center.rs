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