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
    res.status(error.response.status).json({ error: error.response.data.error });
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

app.post('/game/bot/choose/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const chooseUrl = new URL(`/v1/ybot/choose/${botId}`, gameyServiceUrl);
    const response = await axios.post(chooseUrl.href, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleErrors(res, error);
  }
});

app.listen(port, () => console.log(`Gateway listening on ${port}`))
