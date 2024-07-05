const express = require('express');
const helmet = require('helmet');
const csrf = require('csurf');
const cors = require('cors');
const logger = require('./logger');
const connectDB = require('./config/db');
const contactRoutes = require('./routes/contact');
const limiter = require('./middlewares/limiter');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

connectDB();

app.use(express.json());
app.use(helmet());

const corsOptions = {
    origin: [
        'https://maxime-videau.com', 
        'https://www.maxime-videau.com', 
        'https://portfolio-frontend-maxime-videaus-projects.vercel.app',
        'https://www.portfolio-frontend-maxime-videaus-projects.vercel.app'
    ],
    methods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    allowedHeaders: 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
};
app.use(cors(corsOptions));

app.use('/api/', limiter);

app.use(cookieParser());

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    } else {
        csrf({ cookie: true })(req, res, next);
    }
});

// Log all requests
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

app.use('/api', contactRoutes);

app.get('/', (req, res) => {
    res.send('Hello World! Comment ça va ? Bien');
});

// Handle CSRF errors
app.use((err, req, res, next) => {
    if (err.code !== 'EBADCSRFTOKEN') return next(err);

    // CSRF token errors
    logger.error('Invalid CSRF token');
    res.status(403);
    res.send('Form has been tampered with.');
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error(err.message);
    res.status(500).send('Something went wrong');
});

module.exports = app;




