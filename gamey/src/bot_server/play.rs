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
pub struct PlayRequest {
    pub position: YEN,
    pub bot_id: Option<String>,
    pub difficulty: Option<String>,
}

pub type PlayResponse = YEN;

#[axum::debug_handler]
pub async fn play(
    State(state): State<AppState>,
    Path(params): Path<PlayParams>,
    Json(request): Json<PlayRequest>,
) -> Result<Json<PlayResponse>, ErrorResponse> {
    check_api_version(&params.api_version)?;

    let selection = resolve_public_bot_selection(
        request.bot_id.as_deref(),
        request.difficulty.as_deref(),
    )
    .map_err(|error| ErrorResponse {
        api_version: Some(params.api_version.clone()),
        ..error
    })?;

    let mut game = load_game_from_yen(
        request.position,
        &params.api_version,
        Some(&selection.public_bot_id),
    )?;

    let bot = find_registered_bot(&state, &params.api_version, &selection.registry_bot_id)?;

    apply_bot_turn(
        bot.as_ref(),
        &mut game,
        &params.api_version,
        &selection.registry_bot_id,
    )?;

    Ok(Json((&game).into()))
}
