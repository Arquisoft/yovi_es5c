use crate::{
    Coordinates, GameAction, GameY, Movement, YEN,
    bot_server::{
        check_api_version,
        error::ErrorResponse,
        service::{apply_bot_turn, find_registered_bot, load_game_from_yen, winner_char},
        state::AppState,
    },
};
use axum::{
    Json,
    extract::{Path, State},
};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct MoveParams {
    api_version: String,
}

#[derive(Deserialize)]
pub struct MoveRequest {
    pub state: YEN,
    pub row: Option<u32>,
    pub col: Option<u32>,
    pub action: Option<String>,
    pub bot_id: Option<String>,
    pub mode: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MoveTurnResponse {
    pub api_version: String,
    pub game_over: bool,
    pub winner: Option<char>,
    pub bot_move: Option<Coordinates>,
    pub state: YEN,
}

#[axum::debug_handler]
pub async fn move_turn(
    State(state): State<AppState>,
    Path(params): Path<MoveParams>,
    Json(request): Json<MoveRequest>,
) -> Result<Json<MoveTurnResponse>, Json<ErrorResponse>> {
    check_api_version(&params.api_version).map_err(Json)?;
    let is_bot_mode = request.mode.as_deref().unwrap_or("bot") == "bot";

    let mut game =
        load_game_from_yen(request.state.clone(), &params.api_version, None).map_err(Json)?;

    if game.check_game_over() {
        return ok_response(&game, &params.api_version, None);
    }

    let moving_player = match game.next_player() {
        Some(player) => player,
        None => return ok_response(&game, &params.api_version, None),
    };

    let player_move = if let Some(action) = request.action.as_deref() {
        match action.to_ascii_lowercase().as_str() {
            "swap" => Movement::Action {
                player: moving_player,
                action: GameAction::Swap,
            },
            "resign" => Movement::Action {
                player: moving_player,
                action: GameAction::Resign,
            },
            _ => {
                return err_response(
                    "Unsupported action",
                    &params.api_version,
                    request.bot_id.clone(),
                );
            }
        }
    } else {
        let (Some(row), Some(col)) = (request.row, request.col) else {
            return err_response(
                "row and col are required for placement moves",
                &params.api_version,
                request.bot_id.clone(),
            );
        };

        let size = game.board_size();
        if row >= size || col > row {
            return err_response(
                "Invalid row/col for board size",
                &params.api_version,
                request.bot_id.clone(),
            );
        }

        let player_coords = row_col_to_coords(size, row, col);
        Movement::Placement {
            player: moving_player,
            coords: player_coords,
        }
    };

    if let Err(err) = game.add_move(player_move) {
        return err_response(
            &format!("Invalid player move: {}", err),
            &params.api_version,
            request.bot_id.clone(),
        );
    }

    if game.check_game_over() {
        return ok_response(&game, &params.api_version, None);
    }

    if !is_bot_mode {
        return ok_response(&game, &params.api_version, None);
    }

    let bot_id = match request.bot_id {
        Some(bot_id) if !bot_id.trim().is_empty() => bot_id,
        _ => {
            return err_response(
                "bot_id is required in bot mode",
                &params.api_version,
                None,
            );
        }
    };

    let bot = find_registered_bot(&state, &params.api_version, &bot_id).map_err(Json)?;
    let bot_coords =
        apply_bot_turn(bot.as_ref(), &mut game, &params.api_version, &bot_id).map_err(Json)?;

    ok_response(&game, &params.api_version, bot_coords)
}

fn row_col_to_coords(size: u32, row: u32, col: u32) -> Coordinates {
    let x = size - 1 - row;
    let y = col;
    let z = row - col;
    Coordinates::new(x, y, z)
}

fn ok_response(
    game: &GameY,
    api_version: &str,
    bot_move: Option<Coordinates>,
) -> Result<Json<MoveTurnResponse>, Json<ErrorResponse>> {
    let winner = winner_char(game);
    let response_state: YEN = game.into();
    Ok(Json(MoveTurnResponse {
        api_version: api_version.to_string(),
        game_over: winner.is_some(),
        winner,
        bot_move,
        state: response_state,
    }))
}

fn err_response(
    message: &str,
    api_version: &str,
    bot_id: Option<String>,
) -> Result<Json<MoveTurnResponse>, Json<ErrorResponse>> {
    Err(Json(ErrorResponse::error(
        message,
        Some(api_version.to_string()),
        bot_id,
    )))
}
