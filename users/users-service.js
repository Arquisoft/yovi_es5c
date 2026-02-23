const express = require('express');
const app = express();
const port = 3000;
const swaggerUi = require('swagger-ui-express');
const fs = require('node:fs');
const YAML = require('js-yaml');
const promBundle = require('express-prom-bundle');
const bcrypt = require('bcrypt');
const User = require('./model/user-model');

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

if (require.main === module) {
  app.listen(port, () => {
    console.log(`User Service listening at http://localhost:${port}`)
  })
}

module.exports = app

app.post('/user', async (req, res) => {
    try {
        const { username, password, name, surname } = req.body;

        const sanitizedUsername = username.trim().toLowerCase();
        const user = await User.findOne({ username: sanitizedUsername });

        registerValidators(user, username, password, name, surname);

        // Encrypt the password before saving it
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new User({
            username: req.body.username,
            password: hashedPassword,
            name: req.body.name,
            surname: req.body.surname,
        });

        await newUser.save(); 
        res.json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message }); 
}});

function registerValidators(user, username, password, name, surname){
    if (user != null) {
      throw new Error('Invalid username');
    }

    // Email validation
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

    // Name validation
    if (!name.trim()) {
        throw new Error('The name cannot be empty or contain only spaces');
    }
    
    // Surname validation
    if (!surname.trim()) {
        throw new Error('The surname cannot be empty or contain only spaces');
    }
}