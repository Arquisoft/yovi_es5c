//! An edge-seeking bot implementation.
//!
//! This module provides [`EdgeBot`], a bot that prioritizes cells touching
//! the sides of the triangular board, using the number of sides touched
//! as the primary score, and proximity to center as a tiebreaker.
 
use crate::{Coordinates, GameY, YBot};
 
/// A bot that prioritizes cells that touch the sides of the board.
///
/// In the Game of Y, the winning condition is to connect all three sides
/// of the triangle. `EdgeBot` reasons directly from this goal: a cell
/// touching two sides is worth more than one touching only one side,
/// which in turn is worth more than an interior cell touching none.
///
/// Scoring per cell:
/// - Each side touched adds 10 points
/// - Tiebreaker: proximity to center (same logic as [`CenterBot`])
///
/// This means:
/// - Corner cell (touches 2 sides): primary score = 20
/// - Edge cell (touches 1 side):    primary score = 10
/// - Interior cell (touches 0):     primary score = 0
///
/// # Strengths
/// - Always anchors pieces to at least one side of the board
/// - Naturally builds towards the winning condition from the start
/// - Simple and fast — no board state inspection needed
///
/// # Weaknesses
/// - Ignores the opponent entirely
/// - Corners are overrated: they only connect two sides, not three
/// - Interior cells that would join existing chains are ignored
///
pub struct EdgeBot;
 
impl YBot for EdgeBot {
    fn name(&self) -> &str {
        "edge_bot"
    }
 
    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        let size = board.board_size();
        let target = (size - 1) / 3;
 
        board
            .available_cells()
            .iter()
            .map(|&idx| Coordinates::from_index(idx, size))
            .max_by_key(|coords| {
                // Criterio primario: cuántos lados toca esta celda
                // Cada lado suman 10 puntos, máximo 20 (esquinas tocan 2 lados,
                // ninguna celda puede tocar los 3 a la vez en un tablero válido)
                let sides = sides_touched(coords);
 
                // Criterio secundario: distancia al centro invertida
                // Resuelve empates entre celdas que tocan el mismo número de lados
                let dist = coords.x().abs_diff(target)
                    + coords.y().abs_diff(target)
                    + coords.z().abs_diff(target);
                let center_score = u32::MAX - dist;
 
                (sides, center_score)
            })
    }
}
 
/// Returns how many sides of the board this cell touches, multiplied by 10.
///
/// Each coordinate being 0 means the cell lies on that side:
/// - x == 0 → touches side A
/// - y == 0 → touches side B
/// - z == 0 → touches side C
///
/// The score is multiplied by 10 to leave room for the tiebreaker
/// without the two criteria interfering with each other.
fn sides_touched(coords: &Coordinates) -> u32 {
    let mut score = 0u32;
    if coords.touches_side_a() { score += 10; }
    if coords.touches_side_b() { score += 10; }
    if coords.touches_side_c() { score += 10; }
    score
}