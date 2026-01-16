import axios from 'axios';
import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:5000/api';
  return 'http://localhost:5000/api';
};

//  On configure ici l'adresse du serveur et le temps d'attente maximum
export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
});

//  Cette fonction sert à "coller" le badge de sécurité (token) sur chaque appel au serveur
export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};

//  Regroupe tout ce qui touche aux utilisateurs et aux favoris
export const utilisateurAPI = {
  getProfil: () => api.get('/utilisateurs/profil'),
  syncUtilisateur: (data) => api.post('/utilisateurs/sync', data),
  getStats: () => api.get('/utilisateurs/admin/stats'),
  getAllUtilisateurs: () => api.get('/utilisateurs/admin/all'),
  changerRole: (userId, role) => api.patch(`/utilisateurs/admin/${userId}/role`, { role }),
  deleteUtilisateur: (userId) => api.delete(`/utilisateurs/admin/${userId}`),
  syncAllUsers: () => api.post('/utilisateurs/admin/sync-all'),
  cleanupFirebaseUsers: () => api.post('/utilisateurs/admin/cleanup-firebase'),
  getFavoris: () => api.get('/utilisateurs/favoris'),
  addFavori: (recetteId) => api.post('/utilisateurs/favoris', { recetteId }),
  removeFavori: (recetteId) => api.delete(`/utilisateurs/favoris/${recetteId}`),
};

//  Regroupe tout ce qui concerne les recettes (voir, ajouter, valider...)
export const recetteAPI = {
  getAll: () => api.get('/recettes'),
  getById: (id) => api.get(`/recettes/${id}`),
  getRecetteById: (id) => api.get(`/recettes/${id}`),
  getMesRecettes: () => api.get('/recettes/mes-recettes'),
  addRecette: (data) => api.post('/recettes', data),
  updateRecette: (id, data) => api.put(`/recettes/${id}`, data),
  deleteRecette: (id) => api.delete(`/recettes/${id}`),
  searchRecettes: (params) => api.get('/recettes/search', { params }),
  getAllRecettesAdmin: () => api.get('/recettes/admin/all'),
  validerRecette: (id) => api.patch(`/recettes/${id}/valider`, { statut: 'APPROUVEE' }),
  refuserRecette: (id, raison) => api.patch(`/recettes/${id}/refuser`, { statut: 'REFUSEE', raisonRefus: raison }),
};

export const commentaireAPI = {
  getByRecette: (recetteId) => api.get(`/commentaires/recette/${recetteId}`),
  addCommentaire: (data) => api.post('/commentaires', data),
  updateCommentaire: (id, data) => api.put(`/commentaires/${id}`, data),
  deleteCommentaire: (id) => api.delete(`/commentaires/${id}`),
  getMesCommentaires: () => api.get('/commentaires/mes-commentaires'),
  getAllCommentaires: () => api.get('/commentaires/admin/all'),
};

export const demandeModificationAPI = {
  getAll: () => api.get('/demandes-modification'),
  create: (data) => api.post('/demandes-modification', data),
  approuver: (id) => api.patch(`/demandes-modification/${id}/approuver`),
  rejeter: (id, raison) => api.patch(`/demandes-modification/${id}/rejeter`, { raison }),
};

export const notificationAPI = {
  getMesNotifications: () => api.get('/notifications'),
  marquerCommeLue: (id) => api.put(`/notifications/marquer-lue/${id}`),
  toutMarquerCommeLues: () => api.put('/notifications/tout-marquer-lu'),
  supprimer: (id) => api.delete(`/notifications/${id}`),
};

export const signalementAPI = {
  creer: (data) => api.post('/signalements', data),
  getAll: () => api.get('/signalements/admin/all'),
  supprimer: (id) => api.delete(`/signalements/admin/${id}`),
};

export default api;
