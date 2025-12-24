const mongoose = require('mongoose');
require('dotenv').config();

// Configuration de la connexion MongoDB Compass
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/applirecette';

// Options de connexion (Mongoose 7+)
const options = {
  // Les options useNewUrlParser et useUnifiedTopology sont désormais true par défaut dans Mongoose 7+
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
};

// Événements de connexion
mongoose.connection.on('connecting', () => {
  console.log('🔄 Tentative de connexion à MongoDB Compass...');
});

mongoose.connection.on('connected', () => {
  console.log('✅ Connecté à MongoDB Compass avec succès');
  console.log(`🔗 URI: ${MONGODB_URI}`);
  console.log(`🗂️  Base de données: ${mongoose.connection.name}`);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur de connexion à MongoDB Compass:', err.message);
  console.log('Vérifiez que MongoDB Compass est bien démarré et que l\'URI est correcte');
});

mongoose.connection.on('disconnected', () => {
  console.log('❌ Déconnecté de MongoDB Compass');
});

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log(`MongoDB Compass connecté: ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (error) {
    console.error(`Erreur de connexion à MongoDB Compass: ${error.message}`);
    console.log('Vérifiez que MongoDB Compass est bien démarré et accessible');
    process.exit(1);
  }
};

// Fonction utilitaire pour obtenir le nom de l'état de la connexion
function getStateName(state) {
  const states = {
    0: 'Déconnecté',
    1: 'Connecté',
    2: 'Connexion en cours',
    3: 'Déconnexion en cours',
  };
  return states[state] || 'Inconnu';
}

module.exports = connectDB;
