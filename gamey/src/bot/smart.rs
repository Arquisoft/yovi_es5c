//! This module provides [`SmartBot`], a bot that prioritizes cells that
//! wins the game or block the rival victory.

use crate::bot::strategies;
use crate::{Coordinates, GameY, YBot};

pub struct SmartBot {
    /// Difficulty level: 1 = easy, 2 = medium, 3 = hard.
    pub level: u8,
}

impl YBot for SmartBot {
    fn name(&self) -> &str {
        match self.level {
            1 => "smart_bot_1",
            2 => "smart_bot_2",
            _ => "smart_bot",
        }
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        match self.level {
            // Nivel 1: bloquea si el rival va a ganar, si no juega random
            1 => strategies::blocking_move(board)
                    .or_else(|| strategies::random_move(board)),
            // Nivel 2: gana si puede, si no juega edge
            2 => strategies::winning_move(board)
                    .or_else(|| strategies::edge_move(board)),
            // Nivel 3: gana si puede, bloquea si el rival va a ganar, si no greedy_center
            _ => strategies::win_check_move(board),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Coordinates, Movement, PlayerId};

    // ─── Helper para construir un tablero tamaño 2 con 2 piezas colocadas ────────
    //
    // Tablero tamaño 2 — celdas: (1,0,0), (0,1,0), (0,0,1)
    // Con (1,0,0) para jugador 0 y (0,1,0) para jugador 1,
    // la única celda libre es (0,0,1) y colocarla gana al jugador 0

    fn board_one_move_from_win() -> GameY {
        let mut game = GameY::new(2);
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(1, 0, 0),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(0, 1, 0),
        }).unwrap();
        game
    }

    // ─── Tests de nombre ──────────────────────────────────────────────────────────

    #[test]
    fn test_name_level1() {
        assert_eq!(SmartBot { level: 1 }.name(), "smart_bot_1");
    }

    #[test]
    fn test_name_level2() {
        assert_eq!(SmartBot { level: 2 }.name(), "smart_bot_2");
    }

    #[test]
    fn test_name_level3() {
        assert_eq!(SmartBot { level: 3 }.name(), "smart_bot");
    }

    // ─── Tests básicos ────────────────────────────────────────────────────────────

    #[test]
    fn test_all_levels_return_move_on_empty_board() {
        let game = GameY::new(5);
        for level in 1..=3 {
            assert!(
                SmartBot { level }.choose_move(&game).is_some(),
                "nivel {} devolvió None en tablero vacío", level
            );
        }
    }

    #[test]
    fn test_all_levels_return_none_on_full_board() {
        for level in 1..=3 {
            let bot = SmartBot { level };
            let mut game = GameY::new(2);
            let moves = vec![
                Movement::Placement { player: PlayerId::new(0), coords: Coordinates::new(1, 0, 0) },
                Movement::Placement { player: PlayerId::new(1), coords: Coordinates::new(0, 1, 0) },
                Movement::Placement { player: PlayerId::new(0), coords: Coordinates::new(0, 0, 1) },
            ];
            for mv in moves { game.add_move(mv).unwrap(); }
            assert!(
                bot.choose_move(&game).is_none(),
                "nivel {} debería devolver None en tablero lleno", level
            );
        }
    }

    #[test]
    fn test_all_levels_return_available_cell() {
        let game = GameY::new(5);
        for level in 1..=3 {
            let coords = SmartBot { level }.choose_move(&game).unwrap();
            let idx = coords.to_index(game.board_size());
            assert!(
                game.available_cells().contains(&idx),
                "nivel {} eligió celda no disponible", level
            );
        }
    }

    // ─── Tests de comportamiento nivel 1 ─────────────────────────────────────────

    #[test]
    fn test_level1_blocks_rival_win() {
        // Jugador 0 puede ganar en (0,0,1) — pero es turno del jugador 1.
        // Nivel 1 debe detectar la amenaza y bloquear.
        let mut game = GameY::new(2);
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(1, 0, 0),
        }).unwrap();
        // Ahora es turno del jugador 1. Jugador 0 ganaría en (0,0,1).
        // Nivel 1 debe bloquear ahí.
        let result = SmartBot { level: 1 }.choose_move(&game);
        assert!(result.is_some());
        assert_eq!(
            result.unwrap(),
            Coordinates::new(0, 0, 1),
            "nivel 1 debería bloquear la victoria inmediata del rival"
        );
    }

    #[test]
    fn test_level1_plays_random_when_no_threat() {
        // En tablero vacío no hay amenaza → cae a random → debe ser celda válida
        let game = GameY::new(5);
        let coords = SmartBot { level: 1 }.choose_move(&game).unwrap();
        let idx = coords.to_index(game.board_size());
        assert!(game.available_cells().contains(&idx));
    }

    // ─── Tests de comportamiento nivel 2 ─────────────────────────────────────────

    #[test]
    fn test_level2_takes_immediate_win() {
        // Es turno del jugador 0 y puede ganar en (0,0,1)
        let game = board_one_move_from_win();
        let result = SmartBot { level: 2 }.choose_move(&game);
        assert!(result.is_some());
        assert_eq!(
            result.unwrap(),
            Coordinates::new(0, 0, 1),
            "nivel 2 debería tomar la victoria inmediata"
        );
    }

    #[test]
    fn test_level2_plays_edge_when_no_win() {
        // En tablero vacío no hay victoria → cae a edge_move → debe tocar un lado
        let game = GameY::new(7);
        let coords = SmartBot { level: 2 }.choose_move(&game).unwrap();
        assert!(
            coords.touches_side_a() || coords.touches_side_b() || coords.touches_side_c(),
            "nivel 2 debería jugar edge cuando no hay victoria inmediata, eligió {:?}", coords
        );
    }

   
    // ─── Tests de comportamiento nivel 3 ─────────────────────────────────────────

    #[test]
    fn test_level3_takes_immediate_win() {
        let game = board_one_move_from_win();
        let result = SmartBot { level: 3 }.choose_move(&game);
        assert!(result.is_some());
        assert_eq!(
            result.unwrap(),
            Coordinates::new(0, 0, 1),
            "nivel 3 debería tomar la victoria inmediata"
        );
    }

    #[test]
    fn test_level3_blocks_rival_win() {
        // Mismo escenario que nivel 1 pero desde perspectiva del rival
        let mut game = GameY::new(2);
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(1, 0, 0),
        }).unwrap();
        // Es turno del jugador 1, jugador 0 ganaría en (0,0,1)
        let result = SmartBot { level: 3 }.choose_move(&game);
        assert!(result.is_some());
        assert_eq!(
            result.unwrap(),
            Coordinates::new(0, 0, 1),
            "nivel 3 debería bloquear la victoria del rival"
        );
    }

    #[test]
    fn test_level3_prefers_win_over_block() {
        // Si el bot puede ganar Y hay que bloquear, debe ganar primero.
        // Construimos un tablero donde ambas cosas son posibles:
        // usamos un tablero tamaño 2 donde el jugador actual también gana
        // de inmediato — en ese caso winning_move tiene prioridad sobre blocking.
        let game = board_one_move_from_win();
        // El jugador 0 puede ganar en (0,0,1).
        // win_check_move debe devolver esa celda (victoria antes que bloqueo).
        let result = SmartBot { level: 3 }.choose_move(&game);
        assert_eq!(result.unwrap(), Coordinates::new(0, 0, 1));
    }

    #[test]
    fn test_level3_falls_back_to_greedy_center() {
        // En tablero vacío no hay victoria ni amenaza → cae a greedy_center
        // que en tablero de tamaño 7 vacío elige (2,2,2)
        let game = GameY::new(7);
        let coords = SmartBot { level: 3 }.choose_move(&game).unwrap();
        assert_eq!(
            coords,
            Coordinates::new(2, 2, 2),
            "nivel 3 debería caer a greedy_center y elegir (2,2,2) en tablero vacío"
        );
    }
}