require('dotenv').config({ silent: true });
require('./config/firebaseAdmin');
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const utilisateurRoutes = require('./routes/utilisateurRoutes');
const signalementRoutes = require('./routes/signalementRoutes');
const recetteRoutes = require('./routes/recetteRoutes');
const commentaireRoutes = require('./routes/commentaireRoutes');
const demandeModificationRoutes = require('./routes/demandeModificationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Routes
app.get('/', (req, res) => {
  res.send('API en cours d\'exécution');
});

// API routes
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/signalements', signalementRoutes);
app.use('/api/recettes', recetteRoutes);
app.use('/api/commentaires', commentaireRoutes);
app.use('/api/demandes-modification', demandeModificationRoutes);
app.use('/api/notifications', notificationRoutes);

// Connexion à la base de données et démarrage du serveur
connectDB()
  .then(() => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
  });
