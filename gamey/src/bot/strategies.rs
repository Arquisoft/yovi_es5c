//! Core movement strategy functions for Y game bots.
//!
//! This makes them interchangeable in bot `choose_move` implementations.
//! Functions that need the current player extract it internally from
//! `board.next_player()`.
//!
//! # Available strategies
//!
//! - [`random_move`]       — picks a random available cell
//! - [`center_move`]       — picks the cell closest to the board center
//! - [`edge_move`]         — picks the cell touching the most board sides
//! - [`greedy_move`]       — picks the cell with most friendly neighbors
//! - [`greedy_center_move`]— greedy with center as tiebreaker
//! - [`mirror_move`]       — copies the opponent's last move using rotational symmetry

use crate::{Coordinates, GameY, PlayerId};
use rand::prelude::IndexedRandom;

// ─── Strategy functions ───────────────────────────────────────────────────────

/// Chooses a random available cell.
pub fn random_move(board: &GameY) -> Option<Coordinates> {
    let size = board.board_size();
    let cell = board.available_cells().choose(&mut rand::rng())?;
    Some(Coordinates::from_index(*cell, size))
}

/// Chooses the available cell closest to the center of the board.
///
/// Uses Manhattan distance in barycentric space to the ideal point
/// `(target, target, target)` where `target = (N-1) / 3`.
pub fn center_move(board: &GameY) -> Option<Coordinates> {
    let size = board.board_size();
    let target = (size - 1) / 3;

    board
        .available_cells()
        .iter()
        .map(|&idx| Coordinates::from_index(idx, size))
        .min_by_key(|coords| {
            coords.x().abs_diff(target)
                + coords.y().abs_diff(target)
                + coords.z().abs_diff(target)
        })
}

/// Chooses the available cell that touches the most sides of the board,
/// breaking ties by proximity to center.
///
/// Each side touched adds 10 to the primary score. Cells touching two
/// sides (corners) score 20, one side (edges) score 10, interior cells 0.
pub fn edge_move(board: &GameY) -> Option<Coordinates> {
    let size = board.board_size();
    let target = (size - 1) / 3;

    board
        .available_cells()
        .iter()
        .map(|&idx| Coordinates::from_index(idx, size))
        .max_by_key(|coords| {
            let sides = sides_touched(coords);
            let dist = coords.x().abs_diff(target)
                + coords.y().abs_diff(target)
                + coords.z().abs_diff(target);
            (sides, u32::MAX - dist)
        })
}

/// Chooses the available cell with the most friendly neighbors.
///
/// Extracts the current player from `board.next_player()` internally.
/// Returns `None` if there is no current player (game is over) or no
/// available cells.
pub fn greedy_move(board: &GameY) -> Option<Coordinates> {
    let size = board.board_size();
    let player = board.next_player()?;

    board
        .available_cells()
        .iter()
        .map(|&idx| Coordinates::from_index(idx, size))
        .max_by_key(|coords| count_friendly_neighbors(board, coords, player))
}

/// Chooses the cell with the most friendly neighbors, breaking ties by
/// proximity to center.
///
/// Combines greedy and center strategies into a single scoring tuple
/// `(friendly, center_score)`. Rust compares tuples lexicographically,
/// so `friendly` always takes priority.
///
/// Extracts the current player from `board.next_player()` internally.
pub fn greedy_center_move(board: &GameY) -> Option<Coordinates> {
    let size = board.board_size();
    let target = (size - 1) / 3;
    let player = board.next_player()?;

    board
        .available_cells()
        .iter()
        .map(|&idx| Coordinates::from_index(idx, size))
        .max_by_key(|coords| {
            let friendly = count_friendly_neighbors(board, coords, player) as u32;
            let dist = coords.x().abs_diff(target)
                + coords.y().abs_diff(target)
                + coords.z().abs_diff(target);
            (friendly, u32::MAX - dist)
        })
}

/// Mirror strategy: Attempts to copy the opponent's last move by 
/// rotating it 120 or 240 degrees.
pub fn mirror_move(board: &GameY) -> Option<Coordinates> {
    let size = board.board_size();

    let Some(last_coords) = board.last_placement_coords() else {
        return center_move(board);
    };

    // Attempt 1: 120° rotation (x, y, z) -> (y, z, x)
    let mirror_1 = last_coords.rotate();
    if board.available_cells().contains(&mirror_1.to_index(size)) {
        return Some(mirror_1);
    }

    // Attempt 2: 240° rotation (y, z, x) -> (z, x, y)
    let mirror_2 = mirror_1.rotate();
    if board.available_cells().contains(&mirror_2.to_index(size)) {
        return Some(mirror_2);
    }

    // If symmetric positions are occupied, fallback to center strategy
    center_move(board)
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

/// Counts how many neighbors of `coords` are occupied by `player`.
pub fn count_friendly_neighbors(board: &GameY, coords: &Coordinates, player: PlayerId) -> usize {
    board
        .get_neighbors(coords)
        .iter()
        .filter(|neighbor| board.cell_player(neighbor) == Some(player))
        .count()
}

/// Returns the number of board sides touched by `coords`, multiplied by 10.
///
/// - x == 0 → touches side A (+10)
/// - y == 0 → touches side B (+10)
/// - z == 0 → touches side C (+10)
pub fn sides_touched(coords: &Coordinates) -> u32 {
    let mut score = 0u32;
    if coords.touches_side_a() { score += 10; }
    if coords.touches_side_b() { score += 10; }
    if coords.touches_side_c() { score += 10; }
    score
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{GameY, Movement, PlayerId};

    #[test]
    fn test_random_move_returns_available_cell() {
        let game = GameY::new(5);
        let coords = random_move(&game).unwrap();
        let idx = coords.to_index(game.board_size());
        assert!(game.available_cells().contains(&idx));
    }

    #[test]
    fn test_center_move_size_7() {
        let game = GameY::new(7);
        let coords = center_move(&game).unwrap();
        assert_eq!(coords, Coordinates::new(2, 2, 2));
    }

    #[test]
    fn test_greedy_move_empty_board_returns_some() {
        let game = GameY::new(5);
        assert!(greedy_move(&game).is_some());
    }

    #[test]
    fn test_greedy_move_returns_none_when_game_over() {
        // Si el juego terminó next_player() devuelve None → greedy_move None
        let mut game = GameY::new(3);
        // Hacemos que el jugador 0 gane
        let moves = vec![
            Movement::Placement { player: PlayerId::new(0), coords: Coordinates::new(0, 2, 0) },
            Movement::Placement { player: PlayerId::new(1), coords: Coordinates::new(2, 0, 0) },
            Movement::Placement { player: PlayerId::new(0), coords: Coordinates::new(0, 1, 1) },
            Movement::Placement { player: PlayerId::new(1), coords: Coordinates::new(1, 1, 0) },
            Movement::Placement { player: PlayerId::new(0), coords: Coordinates::new(0, 0, 2) },
        ];
        for mv in moves { game.add_move(mv).unwrap(); }
        assert!(game.check_game_over());
        assert!(greedy_move(&game).is_none());
    }

    #[test]
    fn test_greedy_center_move_empty_board_picks_center() {
        let game = GameY::new(7);
        let coords = greedy_center_move(&game).unwrap();
        assert_eq!(coords, Coordinates::new(2, 2, 2));
    }

    #[test]
    fn test_edge_move_picks_border_cell() {
        let game = GameY::new(7);
        let coords = edge_move(&game).unwrap();
        assert!(
            coords.touches_side_a() || coords.touches_side_b() || coords.touches_side_c()
        );
    }

    #[test]
    fn test_mirror_move_empty_board_falls_back_to_center() {
        let game = GameY::new(7);
        let coords = mirror_move(&game).unwrap();
        assert_eq!(coords, Coordinates::new(2, 2, 2));
    }

    #[test]
    fn test_sides_touched_corner() {
        assert_eq!(sides_touched(&Coordinates::new(0, 0, 4)), 20);
    }

    #[test]
    fn test_sides_touched_edge() {
        assert_eq!(sides_touched(&Coordinates::new(0, 2, 2)), 10);
    }

    #[test]
    fn test_sides_touched_interior() {
        assert_eq!(sides_touched(&Coordinates::new(2, 2, 2)), 0);
    }
}
