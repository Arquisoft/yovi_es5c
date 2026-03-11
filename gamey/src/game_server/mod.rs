//! HTTP server for game turns.
//!
//! This module extends the original bot API with a game-oriented endpoint:
//! - `POST /{api_version}/game/move`
//!
//! It reuses the existing bot server routes (`/status`, `/ybot/choose`)
//! and adds a single endpoint for full turn processing.

pub mod play;
pub use play::MoveTurnResponse;

use crate::{
    GameYError,
    bot_server::{choose, create_default_state, state::AppState, status},
};

/// Creates the game server router by extending the bot server router.
pub fn create_router(state: AppState) -> axum::Router {
    axum::Router::new()
        .route("/status", axum::routing::get(status))
        .route(
            "/{api_version}/ybot/choose/{bot_id}",
            axum::routing::post(choose::choose),
        )
        .route(
            "/{api_version}/game/move",
            axum::routing::post(play::move_turn),
        )
        .with_state(state)
}

/// Starts the game server on the specified port.
pub async fn run_game_server(port: u16) -> Result<(), GameYError> {
    let state = create_default_state();
    let app = create_router(state);

    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .map_err(|e| GameYError::ServerError {
            message: format!("Failed to bind to {}: {}", addr, e),
        })?;

    println!("Server mode: Listening on http://{}", addr);
    axum::serve(listener, app)
        .await
        .map_err(|e| GameYError::ServerError {
            message: format!("Server error: {}", e),
        })?;

    Ok(())
}
