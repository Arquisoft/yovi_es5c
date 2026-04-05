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
//! - [`winning_move`]      — picks the cell which gives the win
//! - [`blocking_move`]     — picks the cell that block rival from winning
//! - [`win_check_move`]    — picks the winning, if not block, if not the center

use crate::{Coordinates, GameY, PlayerId, Movement};
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
 
/// Returns the first available cell that wins the game immediately, or `None`.
///
/// Simulates placing the current player's piece on each available cell
/// and checks if the game ends. Uses `GameY::clone()` so the real board
/// is never modified.
pub fn winning_move(board: &GameY) -> Option<Coordinates> {
    let size = board.board_size();
    let player = board.next_player()?;
 
    board
        .available_cells()
        .iter()
        .map(|&idx| Coordinates::from_index(idx, size))
        .find(|&coords| is_winning_move_for(board, coords, player))
}
 
/// Returns the first available cell that blocks an immediate rival win, or `None`.
///
/// Simulates placing the rival's piece on each available cell and checks
/// if that would end the game. If so, that cell must be blocked.
pub fn blocking_move(board: &GameY) -> Option<Coordinates> {
    let size = board.board_size();
    let player = board.next_player()?;
    let rival = other_player(player);
 
    board
        .available_cells()
        .iter()
        .map(|&idx| Coordinates::from_index(idx, size))
        .find(|&coords| is_winning_move_for(board, coords, rival))
}
 
/// WinCheck strategy: winning → blocking → greedy_center fallback.
///
/// This is the recommended high-level function to use in a WinCheckBot.
/// It chains the three steps in priority order using `or_else`, which
/// only evaluates the next step if the previous one returned `None`.
pub fn win_check_move(board: &GameY) -> Option<Coordinates> {
    winning_move(board)
        .or_else(|| blocking_move(board))
        .or_else(|| greedy_center_move(board))
}


// ─── Alpha-Beta strategy ──────────────────────────────────────────────────────
 
/// Chooses the best move using minimax search with alpha-beta pruning.
///
/// Explores the game tree up to `depth` plies ahead, assuming both players
/// play optimally. Uses alpha-beta pruning to discard branches that cannot
/// improve the current best result, which allows exploring deeper than
/// plain minimax in the same time.
///
/// Positions are evaluated by [`heuristic`], which scores how close the
/// current player is to connecting all three sides.
///
pub fn alpha_beta_move(board: &GameY, depth: u8) -> Option<Coordinates> {
    let player = board.next_player()?;
    let size = board.board_size();
 

    // Immediate win: if we can win right now, always take it — no search needed.
    if let Some(win) = winning_move(board) {
        return Some(win);
    }
    // Immediate block: if the rival can win right now, always block — no search needed.
    if let Some(block) = blocking_move(board) {
        return Some(block);
    }

    let mut best_coords = None;
    let mut best_score = i32::MIN;
    let mut alpha = i32::MIN;
    let beta = i32::MAX;
 
    for &idx in board.available_cells() {
        let coords = Coordinates::from_index(idx, size);
        let mut copy = board.clone();
        let mv = Movement::Placement { player, coords };
        if copy.add_move(mv).is_err() {
            continue;
        }
 
        // After our move, the rival plays — so we call minimize
        let score = alpha_beta_min(&copy, depth - 1, alpha, beta, player);
 
        if score > best_score {
            best_score = score;
            best_coords = Some(coords);
        }
        alpha = alpha.max(best_score);
    }
 
    eprintln!("[alpha_beta] Mejor movimiento: {:?} con score={}", best_coords, best_score);
    best_coords
}
 
// ─── Alpha-Beta helpers ───────────────────────────────────────────────────────
 
/// Maximizing node: the bot's turn, picks the move with the highest score.
///
/// Recursively calls [`alpha_beta_min`] for the rival's response.
/// Applies a beta cutoff when the current best exceeds the rival's upper
/// bound — the rival would never allow this branch, so we stop exploring.
fn alpha_beta_max(board: &GameY, depth: u8, mut alpha: i32, beta: i32, player: PlayerId) -> i32 {
    if board.check_game_over() {
        return terminal_score(board, player);
    }
    if depth == 0 {
        return heuristic(board, player);
    }
 
    let size = board.board_size();
    let current = match board.next_player() {
        Some(p) => p,
        None => return heuristic(board, player),
    };
 
    let mut best = i32::MIN;
    for &idx in board.available_cells() {
        let coords = Coordinates::from_index(idx, size);
        let mut copy = board.clone();
        if copy.add_move(Movement::Placement { player: current, coords }).is_err() {
            continue;
        }
        let score = alpha_beta_min(&copy, depth - 1, alpha, beta, player);
        best = best.max(score);
        alpha = alpha.max(best);
        // Beta cutoff: the rival would never allow this branch
        if alpha >= beta {
            break;
        }
    }
    best
}
 
/// Minimizing node: the rival's turn, picks the move with the lowest score.
///
/// Recursively calls [`alpha_beta_max`] for the bot's response.
/// Applies an alpha cutoff when the current best falls below the bot's lower
/// bound — the bot would never allow this branch, so we stop exploring.
fn alpha_beta_min(board: &GameY, depth: u8, alpha: i32, mut beta: i32, player: PlayerId) -> i32 {
    if board.check_game_over() {
        return terminal_score(board, player);
    }
    if depth == 0 {
        return heuristic(board, player);
    }
 
    let size = board.board_size();
    let current = match board.next_player() {
        Some(p) => p,
        None => return heuristic(board, player),
    };
 
    let mut best = i32::MAX;
    for &idx in board.available_cells() {
        let coords = Coordinates::from_index(idx, size);
        let mut copy = board.clone();
        if copy.add_move(Movement::Placement { player: current, coords }).is_err() {
            continue;
        }
        let score = alpha_beta_max(&copy, depth - 1, alpha, beta, player);
        best = best.min(score);
        beta = beta.min(best);
        // Alpha cutoff: we would never allow this branch
        if alpha >= beta {
            break;
        }
    }
    best
}
 
/// Returns a terminal score for a finished game.
///
/// Returns `+10_000` if `player` won, `-10_000` if they lost.
/// The large magnitude ensures that any terminal position always dominates
/// heuristic scores, so the bot never prefers a losing strategic position
/// over a forced win or a necessary block.
fn terminal_score(board: &GameY, player: PlayerId) -> i32 {
    match board.status() {
        crate::GameStatus::Finished { winner } => {
            if *winner == player { 10_000 } else { -10_000 }
        }
        _ => 0,
    }
}
 
/// Heuristic evaluation of a non-terminal board position for `player`.
///
/// Uses BFS to find all connected groups of `player` and scores each group
/// based on how many sides of the board it already touches. Groups are what
/// matter in the Game of Y, not individual pieces.
///
/// The rival's score is subtracted making this a zero-sum evaluation.
pub fn heuristic(board: &GameY, player: PlayerId) -> i32 {
    let rival = other_player(player);
    score_for(board, player) - score_for(board, rival)
}

/// Computes the absolute heuristic score for one player.
///
/// Combines two independent signals:
///
/// **1. Group connectivity score**
/// Discovers all connected groups of `player` via BFS and scores each one
/// by how many of the three board sides it already touches, multiplied by
/// the group size. Larger connected chains score much higher than isolated
/// pieces, encouraging the bot to build a single coherent chain rather than
/// spreading pieces across the board.
///
/// | Sides touched | Base score | Notes                        |
/// |---------------|------------|------------------------------|
/// | 3             | 10_000     | Winning — should not occur   |
/// | 2             | 100 × size | One side away from winning   |
/// | 1             | 50 × size  | Building towards connection  |
/// | 0             | 5 × size   | Isolated interior group      |
///
/// A fragmentation penalty of `-20` per extra group beyond the first
/// discourages the bot from maintaining multiple disconnected clusters.
///
/// **2. Positional bonus**
/// Each piece earns a bonus proportional to its proximity to the board
/// center in barycentric Manhattan distance. The center cell earns
/// `POSITIONAL_MAX`; the farthest corner earns 0. This drives the bot
/// to occupy central cells in the opening, where pieces have the most
/// flexibility to connect towards any of the three sides.
fn score_for(board: &GameY, player: PlayerId) -> i32 {
    let size = board.board_size();
    let total_cells = (size * (size + 1)) / 2;

    // --- Connectivity score (groups) ---
    // Each group is scored by sides touched, multiplied by its size so that
    // a long connected chain is worth much more than an isolated piece.
    // A fragmentation penalty of -20 per extra group discourages dispersion.
    let groups = connected_groups_bfs(board, player);
    let fragmentation_penalty = if groups.len() > 1 {
        -20 * (groups.len() as i32 - 1)
    } else {
        0
    };
    let group_score: i32 = groups
        .iter()
        .map(|&(a, b, c, size)| {
            let sides = a as u32 + b as u32 + c as u32;
            let base = match sides {
                3 => 10_000,
                2 => 100,
                1 => 50,
                _ => 5,
            };
            base * size as i32
        })
        .sum::<i32>()
        + fragmentation_penalty;

    // --- Positional bonus (center proximity) ---
    // target = (N-1)/3 is the ideal barycentric coordinate for the center.
    // Manhattan distance in barycentric space: sum of abs differences per axis.
    // We compute the real max distance by iterating all cells, because the
    // theoretical 2*(N-1) is never reached in barycentric space (x+y+z = N-1
    // constrains the geometry), so using it compresses all bonuses toward the
    // top and kills the signal. The real max for N=7 is 8 (corner to center).
    let target = (size - 1) / 3;
    const POSITIONAL_MAX: i32 = 300;

    let max_dist = (0..total_cells)
        .map(|idx| Coordinates::from_index(idx, size))
        .map(|coords| {
            coords.x().abs_diff(target)
                + coords.y().abs_diff(target)
                + coords.z().abs_diff(target)
        })
        .max()
        .unwrap_or(1)
        .max(1); // avoid division by zero on size=1 boards

    let positional_score: i32 = (0..total_cells)
        .map(|idx| Coordinates::from_index(idx, size))
        .filter(|coords| board.cell_player(coords) == Some(player))
        .map(|coords| {
            let dist = coords.x().abs_diff(target)
                + coords.y().abs_diff(target)
                + coords.z().abs_diff(target);
            // Piece at center → POSITIONAL_MAX, piece at farthest corner → 0
            POSITIONAL_MAX * (max_dist - dist) as i32 / max_dist as i32
        })
        .sum();

    group_score + positional_score
}

/// Discovers all connected groups of `player` using BFS.
///
/// Returns a Vec of tuples (touches_a, touches_b, touches_c, size), one per
/// connected component. Uses only public methods get_neighbors and
/// cell_player, so it does not need access to the internal Union-Find.
fn connected_groups_bfs(board: &GameY, player: PlayerId) -> Vec<(bool, bool, bool, usize)> {
    let size = board.board_size();
    let total_cells = (size * (size + 1)) / 2;
    let mut visited = std::collections::HashSet::new();
    let mut groups = Vec::new();

    for idx in 0..total_cells {
        let start = Coordinates::from_index(idx, size);

        if board.cell_player(&start) != Some(player) { continue; }
        if visited.contains(&start) { continue; }

        let mut queue = vec![start];
        let mut touches_a = false;
        let mut touches_b = false;
        let mut touches_c = false;
        let mut group_size = 0usize;

        while let Some(current) = queue.pop() {
            if visited.contains(&current) { continue; }
            visited.insert(current);
            group_size += 1;

            if current.touches_side_a() { touches_a = true; }
            if current.touches_side_b() { touches_b = true; }
            if current.touches_side_c() { touches_c = true; }

            for neighbor in board.get_neighbors(&current) {
                if board.cell_player(&neighbor) == Some(player)
                    && !visited.contains(&neighbor)
                {
                    queue.push(neighbor);
                }
            }
        }

        groups.push((touches_a, touches_b, touches_c, group_size));
    }

    groups
}
 


// ─── Shared helpers ───────────────────────────────────────────────────────────

/// Returns the opponent of `player`.
/// Assumes a two-player game with IDs 0 and 1.
pub fn other_player(player: PlayerId) -> PlayerId {
    if player.id() == 0 { PlayerId::new(1) } else { PlayerId::new(0) }
}
 
/// Simulates placing `player`'s piece at `coords` and checks if it wins.
///
/// Clones the board so the original is never modified.
pub fn is_winning_move_for(board: &GameY, coords: Coordinates, player: PlayerId) -> bool {
    let mut copy = board.clone();
    let mv = Movement::Placement { player, coords };
    copy.add_move(mv).is_ok() && copy.check_game_over()
}

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

    #[test]
    fn test_winning_move_detects_immediate_win() {
        // Tablero tamaño 2: jugador 0 puede ganar colocando en (0,0,1)
        // ya que ese tablero tiene solo 3 celdas y la pieza toca los 3 lados
        let mut game = GameY::new(2);
        // Jugador 0 coloca en (1,0,0) — toca lados B y C
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(1, 0, 0),
        }).unwrap();
        // Jugador 1 coloca en (0,1,0) — toca lados A y C
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(0, 1, 0),
        }).unwrap();
        // Ahora jugador 0 puede ganar en (0,0,1) que toca lados A y B
        // y conecta con su pieza en (1,0,0) → conecta los 3 lados
        let result = winning_move(&game);
        assert!(result.is_some(), "debería detectar el movimiento ganador");
        assert_eq!(result.unwrap(), Coordinates::new(0, 0, 1));
    }
 
    #[test]
    fn test_winning_move_returns_none_when_no_win_available() {
        let game = GameY::new(5);
        // En tablero vacío no hay victoria inmediata
        assert!(winning_move(&game).is_none());
    }

    #[test]
    fn test_blocking_move_returns_none_when_no_win_available() {
        let game = GameY::new(5);
        // En tablero vacío no hay victoria inmediata
        assert!(blocking_move(&game).is_none());
    }
 
   
    #[test]
    fn test_win_check_move_returns_winning_over_blocking() {
        let mut game = GameY::new(2);
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(1, 0, 0),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(0, 1, 0),
        }).unwrap();
        // win_check_move debe elegir la victoria inmediata
        let result = win_check_move(&game);
        assert!(result.is_some());
        assert_eq!(result.unwrap(), Coordinates::new(0, 0, 1));
    }
 
    #[test]
    fn test_is_winning_move_for() {
        let mut game = GameY::new(2);
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(1, 0, 0),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(0, 1, 0),
        }).unwrap();
        assert!(is_winning_move_for(&game, Coordinates::new(0, 0, 1), PlayerId::new(0)));
    }
 
    #[test]
    fn test_other_player() {
        assert_eq!(other_player(PlayerId::new(0)), PlayerId::new(1));
        assert_eq!(other_player(PlayerId::new(1)), PlayerId::new(0));
    }

    #[test]
    fn test_alpha_beta_move_returns_winning_move() {
        // En un tablero donde hay victoria inmediata, alpha_beta debe encontrarla
        let mut game = GameY::new(2);
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(1, 0, 0),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(0, 1, 0),
        }).unwrap();
        let result = alpha_beta_move(&game, 2);
        assert!(result.is_some());
        assert_eq!(result.unwrap(), Coordinates::new(0, 0, 1));
    }
 
    #[test]
    fn test_alpha_beta_move_empty_board_returns_some() {
        let game = GameY::new(4);
        assert!(alpha_beta_move(&game, 2).is_some());
    }
 
     #[test]
    fn test_alpha_beta_takes_immediate_win() {
        // Player 0 can win immediately at (0,0,1) — alpha_beta must take it
        // via the winning_move early exit, regardless of depth.
        let mut game = GameY::new(2);
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(1, 0, 0),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(0, 1, 0),
        }).unwrap();
        let result = alpha_beta_move(&game, 4);
        assert_eq!(result.unwrap(), Coordinates::new(0, 0, 1),
            "alpha_beta must take an immediate win");
    }
 
    #[test]
    fn test_alpha_beta_blocks_immediate_rival_win() {
        // Player 0 has placed at (1,0,0). It is player 1's turn.
        // Player 0 would win at (0,0,1) on the next move — player 1 must block.
        let mut game = GameY::new(2);
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(1, 0, 0),
        }).unwrap();
        // It is now player 1's turn. Player 0 threatens (0,0,1).
        let result = alpha_beta_move(&game, 4);
        assert_eq!(result.unwrap(), Coordinates::new(0, 0, 1),
            "alpha_beta must block the rival's immediate win");
    }
 
 
    #[test]
    fn test_alpha_beta_returns_none_on_finished_game() {
        // Once the game is over next_player() returns None → alpha_beta returns None.
        let mut game = GameY::new(2);
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(1, 0, 0),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(0, 1, 0),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(0, 0, 1),
        }).unwrap();
        assert!(game.check_game_over());
        assert!(alpha_beta_move(&game, 4).is_none(),
            "alpha_beta must return None on a finished game");
    }
 
 
    #[test]
    fn test_heuristic_is_zero_on_empty_board() {
        // Empty board: both players have score 0, difference must be 0.
        let game = GameY::new(7);
        assert_eq!(heuristic(&game, PlayerId::new(0)), 0,
            "heuristic must be 0 on an empty board");
    }
 
    #[test]
    fn test_heuristic_is_zero_sum() {
        // heuristic(player) == -heuristic(rival) for any position.
        let mut game = GameY::new(5);
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(2, 2, 0),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(0, 2, 2),
        }).unwrap();
        let p0 = heuristic(&game, PlayerId::new(0));
        let p1 = heuristic(&game, PlayerId::new(1));
        assert_eq!(p0, -p1, "heuristic must be zero-sum");
    }
 
    #[test]
    fn test_heuristic_favors_larger_group() {
        // Player 0 has a chain of 3 pieces touching 1 side (score 50*3=150).
        // Player 1 has a single piece touching 1 side (score 50*1=50).
        // Player 0 should have a higher heuristic.
        let mut game = GameY::new(7);
        // Player 0: three connected pieces along side A (x=0)
        for mv in [
            Movement::Placement { player: PlayerId::new(0), coords: Coordinates::new(0, 1, 5) },
            Movement::Placement { player: PlayerId::new(1), coords: Coordinates::new(3, 3, 0) },
            Movement::Placement { player: PlayerId::new(0), coords: Coordinates::new(0, 2, 4) },
            Movement::Placement { player: PlayerId::new(1), coords: Coordinates::new(4, 1, 0) },
            Movement::Placement { player: PlayerId::new(0), coords: Coordinates::new(0, 3, 3) },
        ] {
            game.add_move(mv).unwrap();
        }
        let score = heuristic(&game, PlayerId::new(0));
        assert!(score > 0,
            "player 0 with a larger connected group should have a positive heuristic, got {}", score);
    }
 
    
    #[test]
    fn test_heuristic_favors_center_over_corner_on_first_move() {
        // A piece at the center should score higher than a piece at a corner
        // due to the positional bonus, when no sides are touched by either.
        let mut game_center = GameY::new(7);
        game_center.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(2, 2, 2), // center
        }).unwrap();
        game_center.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(3, 2, 1), // near center for rival
        }).unwrap();
 
        let mut game_corner = GameY::new(7);
        game_corner.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(6, 0, 0), // corner
        }).unwrap();
        game_corner.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(3, 2, 1), // same rival piece
        }).unwrap();
 
        let score_center = heuristic(&game_center, PlayerId::new(0));
        let score_corner = heuristic(&game_corner, PlayerId::new(0));
        assert!(score_center > score_corner,
            "center piece (score={}) should outscore corner piece (score={})",
            score_center, score_corner);
    }
}