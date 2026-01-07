import axios from 'axios';

// Détection automatique de la plateforme et configuration de l'URL
const getApiBaseUrl = () => {
  // Pour le web, utiliser localhost (simple et stable)
  if (typeof window !== 'undefined') {
    return 'http://localhost:5000/api';
  }

  // Pour mobile (avec connection par câble USB et ADB reverse)
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000, // 10 secondes de timeout
});

// Intercepteur pour les requêtes
api.interceptors.request.use(
  async (config) => {
    // console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);

    // Pour les requêtes POST, PUT, DELETE, s'assurer que le token est à jour
    // et aussi pour les requêtes GET protégées
    const protectedRoutes = ['/commentaires', '/utilisateurs/favoris', '/demandes-modification', '/recettes'];
    const isProtectedRoute = protectedRoutes.some(route => config.url.includes(route)) ||
      ['POST', 'PUT', 'DELETE'].includes(config.method?.toUpperCase());

    if (isProtectedRoute) {
      try {
        // Importer dynamiquement pour éviter les dépendances circulaires
        const { auth } = require('./firebase');
        if (auth?.currentUser) {
          const token = await auth.currentUser.getIdToken(true); // forceRefresh
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('⚠️ Erreur rafraîchissement token:', error.message);
      }
    }

    return config;
  },
  (error) => {
    console.error('❌ Erreur requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
api.interceptors.response.use(
  (response) => {
    // console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      console.error(`❌ Erreur API ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.response.status, error.response.data);
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('❌ Pas de réponse du serveur:', error.request);
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error('❌ Erreur configuration requête:', error.message);
    }
    return Promise.reject(error);
  }
);

// Utilisateur API
export const utilisateurAPI = {
  getProfil: () => api.get('/utilisateurs/profil'),
  syncUtilisateur: (data) => api.post('/utilisateurs/sync', data),
  getStats: () => api.get('/utilisateurs/admin/stats'),
  getAllUtilisateurs: () => api.get('/utilisateurs/admin/all'),
  changerRole: (id, role) => api.patch(`/utilisateurs/admin/${id}/role`, { role }),
  deleteUtilisateur: (id) => api.delete(`/utilisateurs/admin/${id}`),
  syncAllUsers: () => api.post('/utilisateurs/admin/sync-all'),
  cleanupFirebaseUsers: () => api.post('/utilisateurs/admin/cleanup-firebase'), // New API call
  getFavoris: () => api.get('/utilisateurs/favoris'),
  addFavori: (recetteId) => api.post('/utilisateurs/favoris', { recetteId }),
  removeFavori: (recetteId) => api.delete(`/utilisateurs/favoris/${recetteId}`),
};

// Recette API
export const recetteAPI = {
  getAll: () => api.get('/recettes'),
  getById: (id) => api.get(`/recettes/${id}`),
  create: (data) => api.post('/recettes', data),
  addRecette: (data) => api.post('/recettes', data),
  update: (id, data) => api.put(`/recettes/${id}`, data),
  updateRecette: (id, data) => api.put(`/recettes/${id}`, data),
  delete: (id) => api.delete(`/recettes/${id}`),
  deleteRecette: (id) => api.delete(`/recettes/${id}`),
  approuver: (id) => api.patch(`/recettes/${id}/valider`),
  validerRecette: (id) => api.patch(`/recettes/${id}/valider`),
  refuserRecette: (id, raison) => {
    // Si la route refuser n'existe pas, on peut utiliser valider avec un statut REFUSEE
    return api.patch(`/recettes/${id}/valider`, { statut: 'REFUSEE', raisonRefus: raison });
  },
  getAllRecettesAdmin: () => api.get('/recettes/admin/all'),
  getMesRecettes: () => api.get('/recettes/mes-recettes'),
  searchRecettes: (params) => api.get('/recettes/search', { params }),
};

// Commentaire API
export const commentaireAPI = {
  getByRecette: (recetteId) => api.get(`/commentaires/recette/${recetteId}`),
  addCommentaire: (data) => api.post('/commentaires', data),
  create: (data) => api.post('/commentaires', data),
  updateCommentaire: (id, data) => api.put(`/commentaires/${id}`, data),
  update: (id, data) => api.put(`/commentaires/${id}`, data),
  deleteCommentaire: (id) => api.delete(`/commentaires/${id}`),
  delete: (id) => api.delete(`/commentaires/${id}`),
  getAllCommentaires: () => api.get('/commentaires/admin/all'),
  getMesCommentaires: () => api.get('/commentaires/mes-commentaires'),
};

// Demande Modification API
export const demandeModificationAPI = {
  create: (data) => api.post('/demandes-modification', data),
  getAll: () => api.get('/demandes-modification'),
  getMesDemandes: () => api.get('/demandes-modification/mes-demandes'),
  approuver: (id) => api.patch(`/demandes-modification/${id}/approuver`),
  rejeter: (id, raisonRefus) => api.patch(`/demandes-modification/${id}/rejeter`, { raisonRefus }),
};

// Notification API
export const notificationAPI = {
  getMesNotifications: () => api.get('/notifications'),
  marquerCommeLue: (id) => api.put(`/notifications/marquer-lue/${id}`),
  toutMarquerCommeLues: () => api.put('/notifications/tout-marquer-lu'),
  supprimer: (id) => api.delete(`/notifications/${id}`),
};

// Signalement API
export const signalementAPI = {
  creer: (data) => api.post('/signalements', data),
  getAll: () => api.get('/signalements/admin/all'),
};

// Fonction pour définir le token d'authentification
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};
