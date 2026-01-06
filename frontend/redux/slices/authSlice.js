import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { utilisateurAPI, setAuthToken } from '../../utils/api';

// ════════════════════════════════════════
// 🔄 THUNKS ASYNC
// ════════════════════════════════════════

// Récupérer les favoris
export const fetchFavoris = createAsyncThunk(
    'auth/fetchFavoris',
    async (_, { rejectWithValue }) => {
        try {
            const response = await utilisateurAPI.getFavoris();
            // On suppose que l'API renvoie { data: [ { _id: "...", ... } ] } ou { data: [ "id1", "id2" ] }
            // Adaptez selon votre backend. Ici on stocke la liste complète.
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Ajouter un favori
export const addFavori = createAsyncThunk(
    'auth/addFavori',
    async (recetteId, { rejectWithValue }) => {
        try {
            await utilisateurAPI.addFavori(recetteId);
            return recetteId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Supprimer un favori
export const removeFavori = createAsyncThunk(
    'auth/removeFavori',
    async (recetteId, { rejectWithValue }) => {
        try {
            await utilisateurAPI.removeFavori(recetteId);
            return recetteId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Toggle favori (ajouter ou supprimer selon l'état actuel)
export const toggleFavori = createAsyncThunk(
    'auth/toggleFavori',
    async (recetteId, { getState, dispatch, rejectWithValue }) => {
        try {
            const state = getState();
            const favoris = state.auth.favoris || [];
            const isFavorite = favoris.some(f => (f._id === recetteId) || (f === recetteId));

            if (isFavorite) {
                // Si déjà en favoris, on supprime
                await dispatch(removeFavori(recetteId)).unwrap();
            } else {
                // Sinon, on ajoute
                await dispatch(addFavori(recetteId)).unwrap();
            }

            // Recharger les favoris pour avoir la liste complète
            await dispatch(fetchFavoris());

            return recetteId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Connexion
export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            console.log('🔐 Tentative de connexion avec:', email);

            // Connexion Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('✅ Firebase OK, UID:', user.uid);

            // Récupérer le token et le configurer pour l'API
            const token = await user.getIdToken();
            console.log('✅ Token obtenu');
            setAuthToken(token);

            // Récupération du profil depuis le backend
            console.log('📡 Appel API getProfil...');
            try {
                const response = await utilisateurAPI.getProfil();
                console.log('✅ Profil reçu:', response.data);
                console.log('🔍 Rôle dans response.data:', response.data?.role);
                console.log('🔍 Type du rôle:', typeof response.data?.role);

                const userData = {
                    uid: user.uid,
                    email: user.email,
                    ...response.data,
                };

                // S'assurer que le rôle est bien présent et en majuscules
                if (userData.role) {
                    userData.role = userData.role.toUpperCase();
                }

                console.log('🔍 UserData final avec rôle:', userData.role);
                return userData;
            } catch (apiError) {
                console.error('❌ Erreur API getProfil:', apiError);
                // Si l'API échoue mais que Firebase fonctionne, on retourne quand même les infos Firebase
                // Le middleware devrait créer l'utilisateur automatiquement
                if (apiError.response) {
                    const errorMsg = apiError.response.data?.message || apiError.message;
                    console.error('Détails erreur API:', apiError.response.status, errorMsg);
                    return rejectWithValue(`Erreur serveur: ${errorMsg}`);
                } else if (apiError.request) {
                    console.error('Pas de réponse du serveur');
                    return rejectWithValue('Impossible de contacter le serveur. Vérifiez votre connexion.');
                } else {
                    return rejectWithValue(apiError.message || 'Erreur lors de la récupération du profil');
                }
            }
        } catch (error) {
            console.error('❌ Erreur login complète:', error);
            let errorMessage = 'Email ou mot de passe incorrect';

            if (error.code) {
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'Aucun compte trouvé avec cet email';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Mot de passe incorrect';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Email invalide';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Erreur de connexion réseau';
                        break;
                    default:
                        errorMessage = error.message || errorMessage;
                }
            } else {
                errorMessage = error.message || errorMessage;
            }

            return rejectWithValue(errorMessage);
        }
    }
);

// Inscription
export const register = createAsyncThunk(
    'auth/register',
    async ({ email, password, nom, prenom }, { rejectWithValue }) => {
        try {
            console.log('📝 Inscription Firebase:', email);

            // Inscription Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('✅ Firebase: Utilisateur créé, UID:', user.uid);

            // Récupérer le token et le configurer pour l'API
            const token = await user.getIdToken();
            setAuthToken(token);

            // Synchronisation avec le backend
            console.log('📡 Synchronisation MongoDB...');
            const response = await utilisateurAPI.syncUtilisateur({
                firebaseUid: user.uid,
                email: user.email,
                nom,
                prenom,
            });
            console.log('✅ MongoDB: Utilisateur synchronisé', response.data);

            // Déconnexion immédiate pour forcer la connexion manuelle
            await signOut(auth);

            return {
                uid: user.uid,
                email: user.email,
                ...response.data,
            };
        } catch (error) {
            console.error('❌ Erreur inscription:', error.message);
            return rejectWithValue(error.message);
        }
    }
);

// Déconnexion
export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await signOut(auth);
            return null;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Synchroniser l'utilisateur depuis Firebase
export const syncUser = createAsyncThunk(
    'auth/syncUser',
    async (firebaseUser, { rejectWithValue }) => {
        try {
            if (!firebaseUser) return null;

            const token = await firebaseUser.getIdToken();
            setAuthToken(token);

            const response = await utilisateurAPI.getProfil();

            return {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                ...response.data,
            };
        } catch (error) {
            console.error('⚠️ Erreur lors de la synchronisation:', error.message);
            // En cas d'erreur (ex: backend inaccessible), on retourne les infos Firebase de base
            // avec le token quand même pour permettre les appels API
            if (firebaseUser) {
                try {
                    const token = await firebaseUser.getIdToken();
                    setAuthToken(token);
                    return {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        nom: firebaseUser.displayName?.split(' ')[0] || 'Utilisateur',
                        prenom: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
                        role: 'USER',
                    };
                } catch (tokenError) {
                    console.error('⚠️ Erreur lors de la récupération du token:', tokenError.message);
                }
            }
            return null;
        }
    }
);

// ════════════════════════════════════════
// 🗂️ SLICE
// ════════════════════════════════════════

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        isAuthenticated: false,
        role: null,
        loading: false,
        error: null,
        error: null,
        initialized: false,
        favoris: [], // Liste des IDs des favoris
        loadingFavoris: false,
    },
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
            state.role = action.payload?.role || null;
        },
        clearUser: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.role = null;
        },
        setInitialized: (state, action) => {
            state.initialized = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Login
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.role = action.payload.role;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Register
        builder
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
                // Ne pas connecter l'utilisateur ici, car on veut une connexion manuelle
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Logout
        builder
            .addCase(logout.pending, (state) => {
                state.loading = true;
            })
            .addCase(logout.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
                state.role = null;
                state.error = null;
            })
            .addCase(logout.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Sync User
        builder
            .addCase(syncUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(syncUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = !!action.payload;
                state.role = action.payload?.role || null;
                state.initialized = true;
            })
            .addCase(syncUser.rejected, (state) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
                state.role = null;
                state.initialized = true;
            });

        // Favoris logic
        builder
            .addCase(fetchFavoris.pending, (state) => {
                state.loadingFavoris = true;
            })
            .addCase(fetchFavoris.fulfilled, (state, action) => {
                state.loadingFavoris = false;
                state.favoris = action.payload;
                if (state.user) {
                    state.user.favoris = action.payload;
                }
            })
            .addCase(fetchFavoris.rejected, (state, action) => {
                state.loadingFavoris = false;
                // state.error = action.payload; // On évite de bloquer l'app pour ça
            })
            .addCase(addFavori.fulfilled, (state, action) => {
                const newFav = { _id: action.payload };
                state.favoris.push(newFav);
                if (state.user) {
                    if (!state.user.favoris) state.user.favoris = [];
                    state.user.favoris.push(newFav);
                }
            })
            .addCase(removeFavori.fulfilled, (state, action) => {
                state.favoris = state.favoris.filter(f => (f._id !== action.payload) && (f !== action.payload));
                if (state.user && state.user.favoris) {
                    state.user.favoris = state.user.favoris.filter(f => (f._id !== action.payload) && (f !== action.payload));
                }
            })
            .addCase(toggleFavori.pending, (state) => {
                // Optionnel : on peut ajouter un état de chargement
            })
            .addCase(toggleFavori.fulfilled, (state, action) => {
                // Les favoris sont déjà mis à jour par fetchFavoris qui est dispatché dans toggleFavori
                // Mais pour une fluidité optimale, on laisse les reducers add/remove gérer l'état local via les dispatchs internes de toggleFavori
            })
            .addCase(toggleFavori.rejected, (state, action) => {
                // Gestion d'erreur si nécessaire
            });
    },
});

export const { setUser, clearUser, setInitialized } = authSlice.actions;
export default authSlice.reducer;
