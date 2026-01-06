require('dotenv').config();

const config = {
  // Configuration du serveur
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  
  // Configuration de la base de données
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/applirecette',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  
  // Configuration Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? 
      process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : 
      undefined,
  },
  
  // Configuration des taux de limitation
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  },
  
  // Configuration des CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  
  // Configuration des logs
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    dir: process.env.LOG_DIR || 'logs',
  },
  
  // Configuration de la pagination
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
};

// Validation de la configuration
if (!config.firebase.projectId || !config.firebase.clientEmail || !config.firebase.privateKey) {
  console.warn('⚠️  Les informations de configuration Firebase sont manquantes. L\'authentification ne fonctionnera pas correctement.');
}

module.exports = config;
