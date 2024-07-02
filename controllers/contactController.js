const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
});

const validateRecaptcha = async (recaptchaToken) => {
  const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${recaptchaToken}`);
  return response.data.success;
};

const sendEmail = (name, email, message, callback) => {
  const mailOptions = {
    from: emailUser,
    replyTo: email,
    to: emailUser,
    subject: `Nouveau message de ${name}`,
    text: `Nom: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  transporter.sendMail(mailOptions, callback);
};

module.exports = {
  validateRecaptcha,
  sendEmail
};
