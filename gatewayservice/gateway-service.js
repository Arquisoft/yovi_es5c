const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const morgan = require('morgan')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const port = process.env.PORT || 8000

const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3000';
const gameyServiceUrl = process.env.GAMEY_SERVICE_URL || 'http://localhost:4000';

const axios = require('axios');
const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('combined'))

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 })
app.use(limiter)

const handleErrors = (res, error) => {
  if (error.response && error.response.status) {
    const backendData = error.response.data || {};
    res.status(error.response.status).json({ error: backendData.error || backendData.message || 'Gateway error' });
  } else if (error.message) {
    res.status(500).json({ error: error.message });
  } else {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Health
app.get('/health', (req, res) => res.json({ ok: true, service: 'gateway' }))

// ----- User Service Endpoints -----

// Register a new user
app.post('/user', async (req, res) => {
  try {
    const userUrl = new URL(`/user`, userServiceUrl);
    const userResponse = await axios.post(userUrl.href, req.body);
    res.json(userResponse.data);
  } catch (error) {
    handleErrors(res, error);
  }
});

// User Login
app.post('/login', async (req, res) => {
  try {
    const loginUrl = new URL(`/login`, userServiceUrl);
    const loginResponse = await axios.post(loginUrl.href, req.body);
    res.json(loginResponse.data);
  } catch (error) {
    handleErrors(res, error);
  }
});

app.get('/user/:username', async (req, res) => {
  try {
    const profileUrl = new URL(`/user/${encodeURIComponent(req.params.username)}`, userServiceUrl);
    const profileResponse = await axios.get(profileUrl.href);
    res.json(profileResponse.data);
  } catch (error) {
    handleErrors(res, error);
  }
});

app.put('/user/:username', async (req, res) => {
  try {
    const profileUrl = new URL(`/user/${encodeURIComponent(req.params.username)}`, userServiceUrl);
    const profileResponse = await axios.put(profileUrl.href, req.body);
    res.json(profileResponse.data);
  } catch (error) {
    handleErrors(res, error);
  }
});

app.post('/logout', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'username is required' });
    }

    const usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://users:3000';

    const response = await axios.post(`${usersServiceUrl}/logout`, {
      username: username.trim(),
    });

    res.status(200).json(response.data);
  } catch (error) {
    // Mantén el estilo del gateway: propagar status si existe
    const status = error?.response?.status || 500;
    const data = error?.response?.data || { error: error.message || 'Gateway error' };
    res.status(status).json(data);
  }
});

app.get('/user/:username/history', async (req, res) => {
  try {

    const { username } = req.params;

    const historyUrl = new URL(`/user/${username}/history`, userServiceUrl);

    const response = await axios.get(historyUrl.href);

    res.status(200).json(response.data);

  } catch (error) {
    handleErrors(res, error);
  }
});

app.post('/game/finish', async (req, res) => {
  try {

    const finishUrl = new URL('/game/finish', userServiceUrl);

    const response = await axios.post(finishUrl.href, req.body);

    res.status(201).json(response.data);

  } catch (error) {
    handleErrors(res, error);
  }
});

// ----- Gamey Service Endpoints -----

app.get('/game/status', async (req, res) => {
  try {
    const statusUrl = new URL('/status', gameyServiceUrl);
    const response = await axios.get(statusUrl.href);
    res.status(200).send(response.data);
  } catch (error) {
    handleErrors(res, error);
  }
});

// ─── Valores válidos para partidas contra bot ─────────────────────────────────
const VALID_BOTS        = new Set(['random_bot', 'center_bot', 'edge_bot']);
const VALID_DIFFICULTIES = new Set(['Easy', 'Medium', 'Hard']);
const DIFFICULTY_SUFFIX = { Easy: '_1', Medium: '_2', Hard: '' };
const DEFAULT_PUBLIC_BOT_ID = 'center_bot';
const DEFAULT_PUBLIC_DIFFICULTY = 'Hard';

function resolveBotName(bot_id, difficulty) {
  return bot_id + DIFFICULTY_SUFFIX[difficulty];
}

function resolvePublicBotConfig(bot_id, difficulty) {
  const resolvedBotId = bot_id || DEFAULT_PUBLIC_BOT_ID;
  if (!VALID_BOTS.has(resolvedBotId)) {
    return { error: `Unknown bot_id: ${resolvedBotId}` };
  }

  const resolvedDifficulty = difficulty || DEFAULT_PUBLIC_DIFFICULTY;
  if (!VALID_DIFFICULTIES.has(resolvedDifficulty)) {
    return { error: `Unknown difficulty: ${resolvedDifficulty}` };
  }

  return {
    bot_id: resolvedBotId,
    difficulty: resolvedDifficulty,
    registry_bot_id: resolveBotName(resolvedBotId, resolvedDifficulty),
  };
}

app.post('/game/move', async (req, res) => {
   try {
    const { mode, bot_id, difficulty } = req.body;
 
    if (mode === 'bot') {
      const resolvedBot = resolvePublicBotConfig(bot_id || 'random_bot', difficulty || 'Medium');
      if (resolvedBot.error) {
        return res.status(400).json({ error: resolvedBot.error });
      }
 
      req.body.bot_id = resolvedBot.registry_bot_id;
      req.body.difficulty = resolvedBot.difficulty;
    }
 
    const moveUrl = new URL('/v1/game/move', gameyServiceUrl);
    const response = await axios.post(moveUrl.href, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleErrors(res, error);
  }
});

app.post('/play', async (req, res) => {
  try {
    const { position, bot_id, difficulty } = req.body;

    if (!position) {
      return res.status(400).json({ error: 'position is required' });
    }

    const resolvedBot = resolvePublicBotConfig(bot_id, difficulty);
    if (resolvedBot.error) {
      return res.status(400).json({ error: resolvedBot.error });
    }

    const playUrl = new URL('/v1/ybot/play', gameyServiceUrl);
    const response = await axios.post(playUrl.href, {
      position,
      bot_id: resolvedBot.bot_id,
      difficulty: resolvedBot.difficulty,
    });

    res.status(200).json(response.data);
  } catch (error) {
    handleErrors(res, error);
  }
});


const server = app.listen(port, () => console.log(`Gateway listening on ${port}`))

module.exports = { app, server, resolveBotName, resolvePublicBotConfig }

