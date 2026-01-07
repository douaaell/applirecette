import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { recetteAPI } from '../../utils/api';

// ════════════════════════════════════════
// 🔄 THUNKS ASYNC
// ════════════════════════════════════════

// Récupérer toutes les recettes
export const fetchRecettes = createAsyncThunk(
    'recettes/fetchRecettes',
    async (_, { rejectWithValue }) => {
        try {
            const response = await recetteAPI.getAll();

            return response.data;
        } catch (error) {
            console.error('❌ Erreur fetchRecettes:', error);
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Recherche avancée
export const searchRecettes = createAsyncThunk(
    'recettes/searchRecettes',
    async (params, { rejectWithValue }) => {
        try {
            const response = await recetteAPI.searchRecettes(params);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Récupérer une recette par ID
export const fetchRecetteById = createAsyncThunk(
    'recettes/fetchRecetteById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await recetteAPI.getRecetteById(id);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Ajouter une recette
export const addRecette = createAsyncThunk(
    'recettes/addRecette',
    async (data, { rejectWithValue }) => {
        try {
            const response = await recetteAPI.addRecette(data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Modifier une recette
export const updateRecette = createAsyncThunk(
    'recettes/updateRecette',
    async ({ id, data }, { rejectWithValue }) => {
        try {


            const response = await recetteAPI.updateRecette(id, data);

            return response.data;
        } catch (error) {
            console.error('❌ Erreur updateRecette:', error);
            console.error('❌ Détails erreur:', error.response?.data);
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Supprimer une recette
export const deleteRecette = createAsyncThunk(
    'recettes/deleteRecette',
    async (id, { rejectWithValue }) => {
        try {
            await recetteAPI.deleteRecette(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Récupérer mes recettes (utilisateur connecté)
export const fetchMesRecettes = createAsyncThunk(
    'recettes/fetchMesRecettes',
    async (_, { rejectWithValue }) => {
        try {
            const response = await recetteAPI.getMesRecettes();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Admin: récupérer toutes les recettes
export const fetchAllRecettesAdmin = createAsyncThunk(
    'recettes/fetchAllRecettesAdmin',
    async (_, { rejectWithValue }) => {
        try {
            const response = await recetteAPI.getAllRecettesAdmin();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Admin: valider une recette
export const validerRecette = createAsyncThunk(
    'recettes/validerRecette',
    async (id, { rejectWithValue }) => {
        try {
            const response = await recetteAPI.validerRecette(id);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Admin: refuser une recette
export const refuserRecette = createAsyncThunk(
    'recettes/refuserRecette',
    async ({ id, raison }, { rejectWithValue }) => {
        try {
            const response = await recetteAPI.refuserRecette(id, raison);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// ════════════════════════════════════════
// 🗂️ SLICE
// ════════════════════════════════════════

const recetteSlice = createSlice({
    name: 'recettes',
    initialState: {
        recettes: [],
        mesRecettes: [],
        recetteDetail: null,
        loading: false,
        error: null,
        searchResults: [],
        searchLoading: false,
    },
    reducers: {
        clearRecetteDetail: (state) => {
            state.recetteDetail = null;
        },
        clearSearchResults: (state) => {
            state.searchResults = [];
        },
    },
    extraReducers: (builder) => {
        // Fetch Recettes
        builder
            .addCase(fetchRecettes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRecettes.fulfilled, (state, action) => {
                state.loading = false;
                state.recettes = action.payload;
            })
            .addCase(fetchRecettes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Search Recettes
        builder
            .addCase(searchRecettes.pending, (state) => {
                state.searchLoading = true;
            })
            .addCase(searchRecettes.fulfilled, (state, action) => {
                state.searchLoading = false;
                state.searchResults = action.payload;
            })
            .addCase(searchRecettes.rejected, (state, action) => {
                state.searchLoading = false;
                state.error = action.payload;
            });

        // Fetch Recette By ID
        builder
            .addCase(fetchRecetteById.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchRecetteById.fulfilled, (state, action) => {
                state.loading = false;
                state.recetteDetail = action.payload;
            })
            .addCase(fetchRecetteById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Add Recette
        builder
            .addCase(addRecette.pending, (state) => {
                state.loading = true;
            })
            .addCase(addRecette.fulfilled, (state, action) => {
                state.loading = false;
                state.mesRecettes.push(action.payload);
            })
            .addCase(addRecette.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Delete Recette
        builder
            .addCase(deleteRecette.fulfilled, (state, action) => {
                state.recettes = state.recettes.filter(r => r._id !== action.payload);
                state.mesRecettes = state.mesRecettes.filter(r => r._id !== action.payload);
            });

        // Fetch Mes Recettes
        builder
            .addCase(fetchMesRecettes.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMesRecettes.fulfilled, (state, action) => {
                state.loading = false;
                state.mesRecettes = action.payload;
            })
            .addCase(fetchMesRecettes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Admin: Valider Recette
        builder
            .addCase(validerRecette.fulfilled, (state, action) => {
                const index = state.recettes.findIndex(r => r._id === action.payload._id);
                if (index !== -1) {
                    state.recettes[index] = action.payload;
                }
            });
    },
});

export const { clearRecetteDetail, clearSearchResults } = recetteSlice.actions;
export default recetteSlice.reducer;
