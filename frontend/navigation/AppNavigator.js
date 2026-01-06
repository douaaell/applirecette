import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { subscribeToAuthChanges } from '../utils/firebase';
import { syncUser } from '../redux/slices/authSlice';
import MainNavigator from './MainNavigator';
import { COLORS } from '../utils/constants';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const AppNavigator = () => {
    const dispatch = useDispatch();
    const { initialized } = useSelector((state) => state.auth);

    useEffect(() => {
        // Utilisation de la version sécurisée qui ne plante pas si Firebase est HS
        const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
            await dispatch(syncUser(firebaseUser));
        });

        return () => unsubscribe();
    }, [dispatch]);

    if (!initialized) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <MainNavigator />
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
});

export default AppNavigator;
