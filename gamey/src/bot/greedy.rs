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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Movement, PlayerId};
 
    #[test]
    fn test_greedy_bot_name() {
        let bot = GreedyBot;
        assert_eq!(bot.name(), "greedy_bot");
    }
 
    #[test]
    fn test_greedy_bot_returns_move_on_empty_board() {
        let bot = GreedyBot;
        let game = GameY::new(5);
        assert!(bot.choose_move(&game).is_some());
    }
 
    #[test]
    fn test_greedy_bot_returns_none_on_full_board() {
        let bot = GreedyBot;
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
    fn test_greedy_bot_prefers_cell_next_to_own_piece() {
        // Tablero de tamaño 5. Colocamos una pieza del jugador 0 en (2,2,0).
        // Luego es el turno del jugador 1 (lo ignoramos) y volvemos al 0.
        // Comprobamos que el bot elige una celda adyacente a (2,2,0).
        let bot = GreedyBot;
        let mut game = GameY::new(5);
 
        // Turno 0: jugador 0 coloca en (2,2,0)
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(2, 2, 0),
        })
        .unwrap();
 
        // Turno 1: jugador 1 coloca en una esquina alejada
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(4, 0, 0),
        })
        .unwrap();
 
        // Ahora es el turno del jugador 0. El bot debe elegir
        // una celda vecina a (2,2,0).
        let chosen = bot.choose_move(&game).unwrap();
        let neighbors = game.get_neighbors(&Coordinates::new(2, 2, 0));
        assert!(
            neighbors.contains(&chosen),
            "GreedyBot debería elegir una celda vecina a su pieza existente, eligió {:?}",
            chosen
        );
    }
 
    #[test]
    fn test_greedy_bot_chosen_cell_is_always_available() {
        let bot = GreedyBot;
        let mut game = GameY::new(5);
 
        for turn in 0..8 {
            let player = PlayerId::new(turn % 2);
            if let Some(coords) = bot.choose_move(&game) {
                let idx = coords.to_index(game.board_size());
                assert!(
                    game.available_cells().contains(&idx),
                    "GreedyBot eligió una celda no disponible en el turno {}",
                    turn
                );
                game.add_move(Movement::Placement { player, coords }).unwrap();
            }
        }
    }
 
    #[test]
    fn test_greedy_bot_valid_coordinates() {
        let bot = GreedyBot;
        let game = GameY::new(7);
        let coords = bot.choose_move(&game).unwrap();
        // Toda celda válida cumple x + y + z = N - 1
        assert_eq!(coords.x() + coords.y() + coords.z(), 6);
    }
 
    #[test]
    fn test_count_friendly_neighbors_empty_board() {
        let game = GameY::new(5);
        let coords = Coordinates::new(2, 2, 0);
        // En un tablero vacío no hay vecinos propios
        let count = count_friendly_neighbors(&game, &coords, PlayerId::new(0));
        assert_eq!(count, 0);
    }
 
    #[test]
    fn test_count_friendly_neighbors_with_pieces() {
        let mut game = GameY::new(5);
 
        // Jugador 0 coloca en (2,2,0)
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(2, 2, 0),
        })
        .unwrap();
 
        // Jugador 1 coloca en cualquier sitio
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(4, 0, 0),
        })
        .unwrap();
 
        // Los vecinos de (2,1,1) incluyen (2,2,0), así que debe contar 1
        let coords = Coordinates::new(2, 1, 1);
        let count = count_friendly_neighbors(&game, &coords, PlayerId::new(0));
        assert_eq!(count, 1);
    }


    #[test]
    fn test_greedy_bot_first_move() {
        let bot = GreedyBot;
        let game = GameY::new(7);
        let coords = bot.choose_move(&game).unwrap();
        // El primer movimiento del bot es siempre a la última casilla del tablero
        assert_eq!(Coordinates::new(0, 6, 0), coords);
    }
}