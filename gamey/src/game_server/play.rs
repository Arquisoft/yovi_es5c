use crate::{
    Coordinates, GameStatus, GameY, Movement, PlayerId, YEN,
    bot_server::{check_api_version, error::ErrorResponse, state::AppState},
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
    pub row: u32,
    pub col: u32,
    pub bot_id: String,
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
    check_api_version(&params.api_version)?;

    let mut game = match GameY::try_from(request.state) {
        Ok(game) => game,
        Err(err) => {
            return err_response(
                &format!("Invalid YEN format: {}", err),
                &params.api_version,
                None,
            );
        }
    };

    let size = game.board_size();
    if request.row >= size || request.col > request.row {
        return err_response(
            "Invalid row/col for board size",
            &params.api_version,
            Some(request.bot_id),
        );
    }

    if game.check_game_over() {
        return ok_response(&game, &params.api_version, None);
    }

    let player_coords = row_col_to_coords(size, request.row, request.col);
    let player_move = Movement::Placement {
        player: PlayerId::new(0),
        coords: player_coords,
    };

    if let Err(err) = game.add_move(player_move) {
        return err_response(
            &format!("Invalid player move: {}", err),
            &params.api_version,
            Some(request.bot_id),
        );
    }

    if game.check_game_over() {
        return ok_response(&game, &params.api_version, None);
    }

    let bot = match state.bots().find(&request.bot_id) {
        Some(bot) => bot,
        None => {
            let available_bots = state.bots().names().join(", ");
            return err_response(
                &format!(
                    "Bot not found: {}, available bots: [{}]",
                    request.bot_id, available_bots
                ),
                &params.api_version,
                Some(request.bot_id),
            );
        }
    };

    let bot_coords = match bot.choose_move(&game) {
        Some(coords) => coords,
        None => return ok_response(&game, &params.api_version, None),
    };

    let bot_player = match game.next_player() {
        Some(player) => player,
        None => return ok_response(&game, &params.api_version, None),
    };

    let bot_move = Movement::Placement {
        player: bot_player,
        coords: bot_coords,
    };
    if let Err(err) = game.add_move(bot_move) {
        return err_response(
            &format!("Invalid bot move: {}", err),
            &params.api_version,
            Some(request.bot_id),
        );
    }

    ok_response(&game, &params.api_version, Some(bot_coords))
}

fn row_col_to_coords(size: u32, row: u32, col: u32) -> Coordinates {
    let x = size - 1 - row;
    let y = col;
    let z = row - col;
    Coordinates::new(x, y, z)
}

fn winner_char(game: &GameY) -> Option<char> {
    match game.status() {
        GameStatus::Finished { winner } => Some(if winner.id() == 0 { 'B' } else { 'R' }),
        GameStatus::Ongoing { .. } => None,
    }
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
