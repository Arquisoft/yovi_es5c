use axum::{
    Json,
    extract::{Path, State},
};
use serde::Deserialize;

use crate::{YEN, check_api_version};

use super::{
    error::ErrorResponse,
    service::{
        apply_bot_turn, find_registered_bot, load_game_from_yen, resolve_public_bot_selection,
    },
    state::AppState,
};

#[derive(Deserialize)]
pub struct PlayParams {
    api_version: String,
}

#[derive(Deserialize)]
#[serde(untagged)]
pub enum PlayRequest {
    Position(YEN),
    WithOptions {
        position: YEN,
        bot_id: Option<String>,
        difficulty: Option<String>,
    },
}

impl PlayRequest {
    fn into_parts(self) -> (YEN, Option<String>, Option<String>) {
        match self {
            PlayRequest::Position(position) => (position, None, None),
            PlayRequest::WithOptions {
                position,
                bot_id,
                difficulty,
            } => (position, bot_id, difficulty),
        }
    }
}

pub type PlayResponse = YEN;

#[axum::debug_handler]
pub async fn play(
    State(state): State<AppState>,
    Path(params): Path<PlayParams>,
    Json(request): Json<PlayRequest>,
) -> Result<Json<PlayResponse>, ErrorResponse> {
    check_api_version(&params.api_version)?;
    let (position, bot_id, difficulty) = request.into_parts();

    let selection = resolve_public_bot_selection(bot_id.as_deref(), difficulty.as_deref())
    .map_err(|error| ErrorResponse {
        api_version: Some(params.api_version.clone()),
        ..error
    })?;

    let mut game = load_game_from_yen(position, &params.api_version, Some(&selection.public_bot_id))?;

    let bot = find_registered_bot(&state, &params.api_version, &selection.registry_bot_id)?;

    apply_bot_turn(
        bot.as_ref(),
        &mut game,
        &params.api_version,
        &selection.registry_bot_id,
    )?;

    Ok(Json((&game).into()))
}
