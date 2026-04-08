const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;
const swaggerUi = require('swagger-ui-express');
const fs = require('node:fs');
const YAML = require('js-yaml');
const promBundle = require('express-prom-bundle');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./model/user-model');
const GameSession = require('./model/gameSession-model');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

if (require.main === module) {
  app.listen(port, () => {
    console.log(`User Service listening at http://localhost:${port}`)
  })
}

module.exports = app

app.post('/user', async (req, res) => {
    try {
        const { username, password, name, surname, email } = req.body;

        const sanitizedUsername = username.trim().toLowerCase();
        const user = await User.findOne({ username: sanitizedUsername });

        registerValidators(user, username, password, name, surname, email);

        // Encrypt the password before saving it
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new User({
            username: req.body.username,
            name: req.body.name,
            surname: req.body.surname,
            email: req.body.email,
            password: hashedPassword,
        });

        await newUser.save(); 
        res.json(newUser);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: "User already exists" })
        } else {
            res.status(400).json({ error: error.message })
        }
}});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        //Username and password must be filled
        if(!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const query = { username: String(username) }; // Forzado de tipo explícito
        const user = await User.findOne(query);

        //Checks user exists in database
        if(!user) {
            return res.status(401).json({ error: 'Incorrect username or password' });
        }

        //Password match verification
        const passwordMatch = await bcrypt.compare(password, user.password);

        if(!passwordMatch) {
            return res.status(401).json({ error: 'Incorrect username or password' });
        }

        //Creates JWT token and returns with success code
        if(!process.env.JWT_SECRET){
            throw new Error("Variable de entorno no configurada.");
        }

        const token = jwt.sign({ userId: user._id, user: username}, process.env.JWT_SECRET, {expiresIn: '24h'});
        res.status(200).json({ token });


    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.get('/user/:username', async (req, res) => {
    try {
        const requestedUsername = req.params.username?.trim();

        if (!requestedUsername) {
            return res.status(400).json({ error: 'Username is required.' });
        }

        const user = await User.findOne({ username: requestedUsername })
            .select('username name surname email');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.put('/user/:username', async (req, res) => {
    try {
        const requestedUsername = req.params.username?.trim();
        const { name, surname, email } = req.body;

        if (!requestedUsername) {
            return res.status(400).json({ error: 'Username is required.' });
        }

        validateProfileFields(name, surname, email);

        const user = await User.findOne({ username: requestedUsername });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.name = name.trim();
        user.surname = surname.trim();
        user.email = email.trim();

        await user.save();

        res.status(200).json({
            username: user.username,
            name: user.name,
            surname: user.surname,
            email: user.email,
            _id: user._id,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.post('/logout', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'username is required' });
    }

    const sanitizedUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: sanitizedUsername });

    if (!user) {
      return res.status(404).json({ error: `User ${sanitizedUsername} not found` });
    }

    user.lastLogoutAt = new Date();
    await user.save();

    res.json({ message: `User ${sanitizedUsername} logged out`, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

function registerValidators(user, username, password, name, surname, email){
    if (user != null) {
      throw new Error('Invalid username');
    }

    // UserName validation
    if (username.trim().length < 4) {
        throw new Error('The username must be at least 4 characters long');
    }

    // Password validation
    if (password.trim().length < 8) {
        throw new Error('The password must be at least 8 characters long');
    }
    if (!/\d/.test(password)) {
        throw new Error('The password must contain at least one numeric character');
    }
    if (!/[A-Z]/.test(password)) {
        throw new Error('The password must contain at least one uppercase letter');
    }

    validateProfileFields(name, surname, email);
}

function validateProfileFields(name, surname, email) {
    if (!name || !name.trim()) {
        throw new Error('The name cannot be empty or contain only spaces');
    }

    if (!surname || !surname.trim()) {
        throw new Error('The surname cannot be empty or contain only spaces');
    }

    if (!email || !email.trim()) {
        throw new Error('The email cannot be empty or contain only spaces');
    }
}

app.get('/user/:username/history', async (req, res) => {
  try {
    const { username } = req.params;

    const history = await GameSession
      .find({ userId: username })
      .sort({ createdAt: -1 });

    res.status(200).json(history);

  } catch (error) {
    res.status(500).json({ error: "Error obtaining history." });
  }
});

app.post('/game/finish', async (req, res) => {
  try {

    const { userId, rival, level, duration, result } = req.body;

    const game = await GameSession.create({
      userId,
      rival,
      level,
      duration,
      result
    });

    res.status(201).json(game);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
