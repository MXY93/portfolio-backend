const express = require('express');
const helmet = require('helmet');
const csrf = require('csurf');
const path = require('path');
const fs = require('fs');
const https = require('https');
const cors = require('cors');
const logger = require('./logger');
const connectDB = require('./config/db');
const contactRoutes = require('./routes/contact');
const limiter = require('./middlewares/limiter');
require('dotenv').config();

const app = express();

connectDB();

app.use(express.json());
app.use(helmet());

const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    allowedHeaders: 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
};
app.use(cors(corsOptions));

app.use('/api/', limiter);

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

app.use('/api', contactRoutes);

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/', (req, res) => {
    res.send('Hello World! Comment ça va ?');
});


module.exports = app;


