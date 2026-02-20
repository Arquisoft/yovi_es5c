const express = require('express');
const app = express();
const port = 3000;
const swaggerUi = require('swagger-ui-express');
const fs = require('node:fs');
const YAML = require('js-yaml');
const promBundle = require('express-prom-bundle');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';

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
// Mongoose user model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

app.post('/createuser', async (req, res) => {
  const username = req.body && req.body.username;
  if (!username || !String(username).trim()) return res.status(400).json({ error: 'username is required' });
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const user = new User({ username: String(username).trim() });
    const saved = await user.save();
    res.json({ message: `User created: ${saved.username}`, id: saved._id });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: err.message || 'failed to create user' });
  }
});

if (require.main === module) {
  mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(port, () => {
        console.log(`User Service listening at http://localhost:${port}`)
      })
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      console.log('Starting server without DB connection (endpoints will fail on DB ops)');
      app.listen(port, () => {
        console.log(`User Service listening at http://localhost:${port}`)
      })
    })
}

module.exports = app
