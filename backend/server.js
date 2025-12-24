require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Connexion à la base de données
connectDB()
  .then(() => {
    console.log(`Base de données connectée: ${process.env.MONGO_URI}`);
    
    // Routes
    app.get('/', (req, res) => {
      res.send('API en cours d\'exécution');
    });

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
  });