const mongoose = require('mongoose');
require('dotenv').config();

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;

const connectDB = async () => {
  try {
    await mongoose.connect(`mongodb+srv://${dbUsername}:${dbPassword}@clusterfirstone.zwko5fr.mongodb.net/?retryWrites=true&w=majority&appName=ClusterFirstOne`);
    console.log('Connexion à MongoDB réussie !');
  } catch (error) {
    console.error('Connexion à MongoDB échouée !', error);
    process.exit(1);
  }
};

module.exports = connectDB;