const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');
const recaptchaClient = new RecaptchaEnterpriseServiceClient();

const projectPath = recaptchaClient.projectPath('maxime-videau-portfolio');

async function validateRecaptcha(recaptchaToken) {
    const request = {
        assessment: {
            event: {
                token: recaptchaToken,
                siteKey: process.env.RECAPTCHA_SITE_KEY,
                expectedAction: 'submit',
            },
        },
        parent: projectPath,
    };

    const [response] = await recaptchaClient.createAssessment(request);
    const { riskAnalysis, tokenProperties } = response;

    if (tokenProperties && tokenProperties.valid && riskAnalysis.score >= 0.5) {
        return true;
    } else {
        return false;
    }
}

const express = require('express');
const { body, validationResult } = require('express-validator');
const logger = require('../logger');
const { validateRecaptcha, sendEmail } = require('../controllers/contactController');

const router = express.Router();

router.post('/contact', [
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

    sendEmail(name, email, message, (error, info) => {
      if (error) {
        logger.error('Error sending email: ', error);
        return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
      }
      logger.info('Email sent: ' + info.response);
      res.status(200).json({ success: 'Email envoyé avec succès' });
    });
});

module.exports = router;
