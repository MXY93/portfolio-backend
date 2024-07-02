const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const logger = require('./logger');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const csrf = require('csurf');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

mongoose.connect(`mongodb+srv://${dbUsername}:${dbPassword}@clusterfirstone.zwko5fr.mongodb.net/?retryWrites=true&w=majority&appName=ClusterFirstOne`)
    .then(() => {
        console.log('Connexion à MongoDB réussie !');
    })
    .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use(express.json());
app.use(helmet());

const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    allowedHeaders: 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes provenant de cette IP, veuillez réessayer après 15 minutes',
});
app.use('/api/', limiter);

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
});

const sslServer = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
  },
  app
)

sslServer.listen(3443, () => console.log('Secure server on port 3443'))

const validateRecaptcha = async (recaptchaToken) => {
  const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${recaptchaToken}`);
  return response.data.success;
};

app.post('/api/contact', [
    body('name').notEmpty().withMessage('Name is required').trim().escape(),
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('message').notEmpty().withMessage('Message is required').trim().escape(),
    body('recaptcha').notEmpty().withMessage('reCAPTCHA is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Validation errors: ', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, message, recaptcha } = req.body;

    const isRecaptchaValid = await validateRecaptcha(recaptcha);
    if (!isRecaptchaValid) {
        logger.error('Invalid reCAPTCHA');
        return res.status(400).json({ error: 'Invalid reCAPTCHA' });
    }

    const mailOptions = {
      from: emailUser,
      replyTo: email,
      to: emailUser,
      subject: `Nouveau message de ${name}`,
      text: `Nom: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        logger.error('Error sending email: ', error);
        return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
      }
      logger.info('Email sent: ' + info.response);
      res.status(200).json({ success: 'Email envoyé avec succès' });
    });
});

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/', (req, res) => {
    res.send('Hello World! Comment ça va ?');
});

module.exports = app;
