const mongoose = require('mongoose');

//  C'est ici qu'on configure la connexion à notre base de données MongoDB
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/recetteApp';

// Options de connexion (Mongoose 7+)
const options = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
};

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log(`✅ Connecté à MongoDB: ${mongoose.connection.host}`);
    console.log(`🗂️  Base de données: ${mongoose.connection.name}`);

    return mongoose.connection;
  } catch (error) {
    console.error(`❌ Erreur de connexion à MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
