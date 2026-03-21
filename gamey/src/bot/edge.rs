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


#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Movement, PlayerId};
 
    #[test]
    fn test_edge_bot_name() {
        let bot = EdgeBot;
        assert_eq!(bot.name(), "edge_bot");
    }
 
    #[test]
    fn test_edge_bot_returns_move_on_empty_board() {
        let bot = EdgeBot;
        let game = GameY::new(5);
        assert!(bot.choose_move(&game).is_some());
    }
 
    #[test]
    fn test_edge_bot_returns_none_on_full_board() {
        let bot = EdgeBot;
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
    fn test_sides_touched_corner() {
        // Una esquina toca 2 lados → score 20
        let corner = Coordinates::new(0, 0, 4); // toca lado A y lado B
        assert_eq!(sides_touched(&corner), 20);
    }
 
    #[test]
    fn test_sides_touched_edge() {
        // Una celda de borde toca 1 lado → score 10
        let edge = Coordinates::new(0, 2, 2); // solo toca lado A
        assert_eq!(sides_touched(&edge), 10);
    }
 
    #[test]
    fn test_sides_touched_interior() {
        // Una celda interior no toca ningún lado → score 0
        let interior = Coordinates::new(2, 2, 2);
        assert_eq!(sides_touched(&interior), 0);
    }
 
    #[test]
    fn test_edge_bot_prefers_edge_over_interior() {
        // En un tablero vacío el bot debe elegir una celda de borde
        // (score 10 o 20) antes que una interior (score 0)
        let bot = EdgeBot;
        let game = GameY::new(7);
        let coords = bot.choose_move(&game).unwrap();
        assert!(
            coords.touches_side_a() || coords.touches_side_b() || coords.touches_side_c(),
            "EdgeBot eligió una celda interior {:?} en lugar de borde",
            coords
        );
    }
 
    #[test]
    fn test_edge_bot_valid_coordinates() {
        let bot = EdgeBot;
        let game = GameY::new(7);
        let coords = bot.choose_move(&game).unwrap();
        assert_eq!(coords.x() + coords.y() + coords.z(), 6);
    }
 
    #[test]
    fn test_edge_bot_chosen_cell_always_available() {
        let bot = EdgeBot;
        let mut game = GameY::new(5);
 
        for turn in 0..8 {
            let player = PlayerId::new(turn % 2);
            if let Some(coords) = bot.choose_move(&game) {
                let idx = coords.to_index(game.board_size());
                assert!(
                    game.available_cells().contains(&idx),
                    "EdgeBot eligió celda no disponible en turno {}",
                    turn
                );
                game.add_move(Movement::Placement { player, coords }).unwrap();
            }
        }
    }
}