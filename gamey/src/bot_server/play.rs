use axum::{
    Json,
    extract::{Path, Query, State},
};
use serde::Deserialize;

use crate::{Coordinates, check_api_version};

use super::{
    error::ErrorResponse,
    service::{
        choose_move_or_error, find_registered_bot, load_game_from_yen, resolve_public_bot_selection,
    },
    state::AppState,
};

#[derive(Deserialize)]
pub struct PlayParams {
    api_version: String,
}

#[derive(Deserialize)]
pub struct PlayQuery {
    position: String,
    bot_id: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct PlayResponse {
    pub coords: Coordinates,
}

#[axum::debug_handler]
pub async fn play(
    State(state): State<AppState>,
    Path(params): Path<PlayParams>,
    Query(query): Query<PlayQuery>,
) -> Result<Json<PlayResponse>, ErrorResponse> {
    check_api_version(&params.api_version)?;
    let position = serde_json::from_str(&query.position).map_err(|error| {
        ErrorResponse::error(
            &format!("Invalid YEN format: {}", error),
            Some(params.api_version.clone()),
            query.bot_id.clone(),
        )
    })?;

    let selection =
        resolve_public_bot_selection(query.bot_id.as_deref()).map_err(|error| ErrorResponse {
            api_version: Some(params.api_version.clone()),
            ..error
        })?;

    let game = load_game_from_yen(position, &params.api_version, Some(&selection.public_bot_id))?;

    let bot = find_registered_bot(&state, &params.api_version, &selection.registry_bot_id)?;

    let coords = choose_move_or_error(
        bot.as_ref(),
        &game,
        &params.api_version,
        &selection.registry_bot_id,
    )?;

    Ok(Json(PlayResponse { coords }))
}
