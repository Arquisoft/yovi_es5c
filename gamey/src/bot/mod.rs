//! Bot module for the Game of Y.
//!
//! This module provides the infrastructure for creating and managing AI bots
//! that can play the Game of Y. It includes:
//!
//! - [`YBot`] - A trait that defines the interface for all bots
//! - [`YBotRegistry`] - A registry for managing multiple bot implementations
//! - [`RandomBot`] - A simple bot that makes random valid moves
//! - [`CenterBot`] - A bot that prioritizes central cells on the board
//! - [`GreedyBot`] - A bot that maximizes connections to its own pieces
//! - [`GreedyCenterBot`] - Greedy with central tiebreaking
//! - [`EdgeBot`] - A bot that prioritizes cells touching the board sides


pub mod edge;
pub mod random;
pub mod center;
pub mod greedy;
pub mod greedy_center;
pub mod ybot;
pub mod ybot_registry;


pub use edge::*;
pub use greedy::*;
pub use greedy_center::*;
pub use center::*;
pub use random::*;
pub use ybot::*;
pub use ybot_registry::*;
