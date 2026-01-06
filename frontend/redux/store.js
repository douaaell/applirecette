import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import recetteReducer from './slices/recetteSlice';

// Configuration de la persistance pour auth
const authPersistConfig = {
    key: 'auth',
    storage: AsyncStorage,
    whitelist: ['user', 'isAuthenticated', 'role'],
};

// Reducer avec persistance
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

// Store Redux
export const store = configureStore({
    reducer: {
        auth: persistedAuthReducer,
        recettes: recetteReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
});

// Persistor
export const persistor = persistStore(store);
