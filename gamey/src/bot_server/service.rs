use std::sync::Arc;

use crate::{Coordinates, GameStatus, GameY, Movement, YBot, YEN};

use super::{error::ErrorResponse, state::AppState};

pub const DEFAULT_PUBLIC_BOT_ID: &str = "center_bot";
pub const DEFAULT_PUBLIC_DIFFICULTY: &str = "Hard";

const VALID_PUBLIC_BOTS: [&str; 3] = ["random_bot", "center_bot", "edge_bot"];
const VALID_DIFFICULTIES: [&str; 3] = ["Easy", "Medium", "Hard"];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BotSelection {
    pub public_bot_id: String,
    pub difficulty: String,
    pub registry_bot_id: String,
}

pub fn resolve_public_bot_selection(
    bot_id: Option<&str>,
    difficulty: Option<&str>,
) -> Result<BotSelection, ErrorResponse> {
    let public_bot_id = bot_id.unwrap_or(DEFAULT_PUBLIC_BOT_ID).trim();
    if !VALID_PUBLIC_BOTS.contains(&public_bot_id) {
        return Err(ErrorResponse::error(
            &format!("Unknown bot_id: {}", public_bot_id),
            None,
            Some(public_bot_id.to_string()),
        ));
    }

    let difficulty = difficulty.unwrap_or(DEFAULT_PUBLIC_DIFFICULTY).trim();
    if !VALID_DIFFICULTIES.contains(&difficulty) {
        return Err(ErrorResponse::error(
            &format!("Unknown difficulty: {}", difficulty),
            None,
            Some(public_bot_id.to_string()),
        ));
    }

    let suffix = match difficulty {
        "Easy" => "_1",
        "Medium" => "_2",
        _ => "",
    };

    Ok(BotSelection {
        public_bot_id: public_bot_id.to_string(),
        difficulty: difficulty.to_string(),
        registry_bot_id: format!("{}{}", public_bot_id, suffix),
    })
}

pub fn load_game_from_yen(
    yen: YEN,
    api_version: &str,
    bot_id: Option<&str>,
) -> Result<GameY, ErrorResponse> {
    GameY::try_from(yen).map_err(|err| {
        ErrorResponse::error(
            &format!("Invalid YEN format: {}", err),
            Some(api_version.to_string()),
            bot_id.map(|value| value.to_string()),
        )
    })
}

pub fn find_registered_bot(
    state: &AppState,
    api_version: &str,
    bot_id: &str,
) -> Result<Arc<dyn YBot>, ErrorResponse> {
    state.bots().find(bot_id).ok_or_else(|| {
        let available_bots = state.bots().names().join(", ");
        ErrorResponse::error(
            &format!(
                "Bot not found: {}, available bots: [{}]",
                bot_id, available_bots
            ),
            Some(api_version.to_string()),
            Some(bot_id.to_string()),
        )
    })
}

pub fn choose_move_or_error(
    bot: &dyn YBot,
    game: &GameY,
    api_version: &str,
    bot_id: &str,
) -> Result<Coordinates, ErrorResponse> {
    bot.choose_move(game).ok_or_else(|| {
        ErrorResponse::error(
            "No valid moves available for the bot",
            Some(api_version.to_string()),
            Some(bot_id.to_string()),
        )
    })
}

pub fn apply_bot_turn(
    bot: &dyn YBot,
    game: &mut GameY,
    api_version: &str,
    bot_id: &str,
) -> Result<Option<Coordinates>, ErrorResponse> {
    if game.check_game_over() {
        return Ok(None);
    }

    let Some(coords) = bot.choose_move(game) else {
        return Ok(None);
    };

    let Some(player) = game.next_player() else {
        return Ok(None);
    };

    let bot_move = Movement::Placement { player, coords };
    game.add_move(bot_move).map_err(|err| {
        ErrorResponse::error(
            &format!("Invalid bot move: {}", err),
            Some(api_version.to_string()),
            Some(bot_id.to_string()),
        )
    })?;

    Ok(Some(coords))
}

pub fn winner_char(game: &GameY) -> Option<char> {
    match game.status() {
        GameStatus::Finished { winner } => Some(if winner.id() == 0 { 'B' } else { 'R' }),
        GameStatus::Ongoing { .. } => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{CenterBot, PlayerId, RandomBot, YBotRegistry};

    struct NoMoveBot;

    impl YBot for NoMoveBot {
        fn name(&self) -> &str {
            "no_move_bot"
        }

        fn choose_move(&self, _board: &GameY) -> Option<Coordinates> {
            None
        }
    }

    #[test]
    fn test_resolve_public_bot_selection_uses_defaults() {
        let selection = resolve_public_bot_selection(None, None).unwrap();
        assert_eq!(selection.public_bot_id, "center_bot");
        assert_eq!(selection.difficulty, "Hard");
        assert_eq!(selection.registry_bot_id, "center_bot");
    }

    #[test]
    fn test_resolve_public_bot_selection_with_medium_suffix() {
        let selection = resolve_public_bot_selection(Some("random_bot"), Some("Medium")).unwrap();
        assert_eq!(selection.registry_bot_id, "random_bot_2");
    }

    #[test]
    fn test_resolve_public_bot_selection_rejects_unknown_difficulty() {
        let error = resolve_public_bot_selection(Some("center_bot"), Some("Impossible"))
            .unwrap_err();
        assert!(error.message.contains("Unknown difficulty"));
    }

    #[test]
    fn test_resolve_public_bot_selection_rejects_unknown_bot() {
        let error = resolve_public_bot_selection(Some("unknown_bot"), Some("Hard")).unwrap_err();
        assert!(error.message.contains("Unknown bot_id"));
    }

    #[test]
    fn test_find_registered_bot_returns_registered_instance() {
        let state = AppState::new(YBotRegistry::new().with_bot(Arc::new(CenterBot { level: 3 })));
        let bot = find_registered_bot(&state, "v1", "center_bot").unwrap();
        assert_eq!(bot.name(), "center_bot");
    }

    #[test]
    fn test_load_game_from_yen_rejects_invalid_layout() {
        let yen = YEN::new(3, 0, vec!['B', 'R'], "invalid".to_string());
        let error = load_game_from_yen(yen, "v1", Some("center_bot")).unwrap_err();
        assert!(error.message.contains("Invalid YEN format"));
        assert_eq!(error.api_version, Some("v1".to_string()));
    }

    #[test]
    fn test_choose_move_or_error_rejects_bot_without_moves() {
        let bot = NoMoveBot;
        let game = GameY::new(3);
        let error = choose_move_or_error(&bot, &game, "v1", "no_move_bot").unwrap_err();
        assert!(error.message.contains("No valid moves available"));
        assert_eq!(error.bot_id, Some("no_move_bot".to_string()));
    }

    #[test]
    fn test_apply_bot_turn_returns_none_when_game_is_over() {
        let bot = RandomBot { level: 3 };
        let game_yen = YEN::new(2, 0, vec!['B', 'R'], "B/RB".to_string());
        let mut game = GameY::try_from(game_yen).unwrap();
        let result = apply_bot_turn(&bot, &mut game, "v1", "random_bot").unwrap();
        assert_eq!(result, None);
    }

    #[test]
    fn test_apply_bot_turn_returns_none_when_bot_has_no_move() {
        let bot = NoMoveBot;
        let mut game = GameY::new(3);
        let result = apply_bot_turn(&bot, &mut game, "v1", "no_move_bot").unwrap();
        assert_eq!(result, None);
    }

    #[test]
    fn test_apply_bot_turn_applies_move_and_changes_turn() {
        let bot = RandomBot { level: 3 };
        let mut game = GameY::new(3);
        let chosen = apply_bot_turn(&bot, &mut game, "v1", "random_bot").unwrap();
        assert!(chosen.is_some());
        assert_eq!(game.next_player(), Some(PlayerId::new(1)));
    }

    #[test]
    fn test_winner_char_returns_none_for_ongoing_game() {
        let game = GameY::new(3);
        assert_eq!(winner_char(&game), None);
    }

    #[test]
    fn test_winner_char_returns_b_for_finished_game() {
        let game_yen = YEN::new(2, 0, vec!['B', 'R'], "B/RB".to_string());
        let game = GameY::try_from(game_yen).unwrap();
        assert_eq!(winner_char(&game), Some('B'));
    }
}
