const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  rival: {
    type: String,
    enum: ['bot', 'user']
  },

  level: {
    type: Number,
    default: 1
  },

  duration: {
    type: Number 
  },

  result: {
    type: String,
    enum: ['win', 'lose']
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

const GameSession = mongoose.model('GameSession', gameSessionSchema);

module.exports = GameSession;