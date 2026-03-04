use crate::{GameStatus, GameY, YEN, check_api_version, error::ErrorResponse};
use axum::{
    Json,
    extract::{Path, State},
};
use serde::{Deserialize, Serialize};

use super::state::AppState;

#[derive(Deserialize)]
pub struct EvaluateParams {
    api_version: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct EvaluateResponse {
    pub api_version: String,
    pub game_over: bool,
    pub winner: Option<char>,
}

#[axum::debug_handler]
pub async fn evaluate(
    State(_state): State<AppState>,
    Path(params): Path<EvaluateParams>,
    Json(yen): Json<YEN>,
) -> Result<Json<EvaluateResponse>, Json<ErrorResponse>> {
    check_api_version(&params.api_version)?;

    let game = match GameY::try_from(yen) {
        Ok(game) => game,
        Err(err) => {
            return Err(Json(ErrorResponse::error(
                &format!("Invalid YEN format: {}", err),
                Some(params.api_version),
                None,
            )));
        }
    };

    let winner = match game.status() {
        GameStatus::Finished { winner } => Some(if winner.id() == 0 { 'B' } else { 'R' }),
        GameStatus::Ongoing { .. } => None,
    };

    Ok(Json(EvaluateResponse {
        api_version: params.api_version,
        game_over: winner.is_some(),
        winner,
    }))
}
