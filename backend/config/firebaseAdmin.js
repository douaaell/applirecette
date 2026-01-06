const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Chemin vers le fichier de clé de service
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

// Vérifier si le fichier de clé de service existe
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
  
  console.log('Firebase Admin initialisé avec la clé de service');
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Si la variable d'environnement est définie
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  console.log('Firebase Admin initialisé avec les credentials par défaut');
} else {
  console.warn('Aucune configuration valide trouvée pour Firebase Admin');  
  // En développement, on peut initialiser sans credentials pour certaines fonctionnalités
  try {
    admin.initializeApp();
    console.warn('Firebase Admin initialisé en mode développement limité');
  } catch (e) {
    if (!/already exists/.test(e.message)) {
      console.error('Erreur d\'initialisation de Firebase Admin:', e.stack);
    }
  }
}

module.exports = admin;