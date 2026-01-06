import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { COLORS, SPACING, SIZES, FONTS, ROLES } from '../utils/constants';

const Header = ({ title, showBack, navigation, showLogout = false }) => {
    const dispatch = useDispatch();
    const { isAuthenticated, user, role } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <View style={styles.container}>
            {/* Bouton retour */}
            {showBack && navigation && (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.card} />
                </TouchableOpacity>
            )}

            {/* Titre */}
            <View style={styles.titleContainer}>
                <Text style={styles.title}>{title}</Text>
            </View>

            {/* Bouton déconnexion */}
            {showLogout && isAuthenticated && (
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={24} color={COLORS.card} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: SIZES.headerHeight,
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.lg,
    },
    backButton: {
        marginRight: SPACING.md,
        padding: SPACING.xs,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: FONTS.sizes.xl,
        fontWeight: '700',
        color: COLORS.card,
    },
    subtitle: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.card,
        opacity: 0.8,
        marginTop: 2,
    },
    logoutButton: {
        marginLeft: SPACING.md,
        padding: SPACING.xs,
    },
});

export default Header;
