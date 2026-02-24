const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;
const swaggerUi = require('swagger-ui-express');
const fs = require('node:fs');
const YAML = require('js-yaml');
const promBundle = require('express-prom-bundle');

// Temporal: Conexión a MongoDB usando la variable de entorno del docker-compose
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);

// Temporal: Definición del esquema de usuario
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  lastLogoutAt: { type: Date, default: null }
});
const User = mongoose.model('User', UserSchema);

const metricsMiddleware = promBundle({includeMethod: true});
app.use(metricsMiddleware);

try {
  const swaggerDocument = YAML.load(fs.readFileSync('./openapi.yaml', 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.log(e);
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

app.post('/createuser', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: `User ${username} already exists`, user: existing });
    }

    const newUser = new User({ username });
    await newUser.save();
    res.json({ message: `User ${username} created successfully in MongoDB`, user: newUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/logout', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: `User ${username} not found` });

    user.lastLogoutAt = new Date();
    await user.save();

    res.json({ message: `User ${username} logged out`, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`User Service listening at http://localhost:${port}`)
  })
}

module.exports = app
