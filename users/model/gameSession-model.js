const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  rival: {
    type: String,
    enum: ['bot', 'multiplayer'], 
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