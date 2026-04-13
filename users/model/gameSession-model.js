const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  rival: {
    type: String,
    enum: ['random_bot', 'center_bot', 'edge_bot','smart_bot', 'mirror_bot','alpha_bot', 'multiplayer'], 
    required: true
  },

  level: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'], 
    default: 'Easy'
  },

  duration: {
    type: Number
  },

  result: {
    type: String,
    enum: ['won', 'lost'], 
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const GameSession = mongoose.model('GameSession', gameSessionSchema);

module.exports = GameSession;