const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes provenant de cette IP, veuillez réessayer après 15 minutes',
});

module.exports = limiter;
