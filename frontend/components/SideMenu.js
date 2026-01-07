import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { COLORS, SPACING, SIZES, FONTS } from '../utils/constants';

const SideMenu = ({ visible, onClose, navigation }) => {
    const dispatch = useDispatch();
    const { isAuthenticated, user, role } = useSelector((state) => state.auth);

    const handleNavigation = (screen, params = {}) => {
        onClose();
        navigation.navigate(screen, params);
    };

    const handleLogout = async () => {
        const confirmLogout = () => {
            return new Promise((resolve) => {
                if (Platform.OS === 'web') {
                    resolve(window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?'));
                } else {
                    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
                        { text: 'Annuler', onPress: () => resolve(false), style: 'cancel' },
                        { text: 'Déconnexion', onPress: () => resolve(true), style: 'destructive' },
                    ]);
                }
            });
        };

        if (await confirmLogout()) {
            await dispatch(logout());
            onClose();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Accueil' }],
            });
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.menuContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.avatarContainer}>
                            {isAuthenticated && user?.photoURL ? (
                                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={40} color={COLORS.secondary} />
                                </View>
                            )}
                        </View>
                        <Text style={styles.menuTitle}>Menu</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* Menu Items */}
                    <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
                        {/* Accueil - Toujours disponible */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleNavigation('Accueil')}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name="home" size={24} color={COLORS.secondary} />
                            </View>
                            <Text style={styles.menuText}>Accueil</Text>
                        </TouchableOpacity>
                        <View style={styles.separator} />

                        {isAuthenticated ? (
                            <>
                                {/* Options Utilisateur */}
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => handleNavigation('AjouterRecette')}
                                >
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="add-circle" size={24} color={COLORS.secondary} />
                                    </View>
                                    <Text style={styles.menuText}>Ajouter une Recette</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => handleNavigation('Notifications')}
                                >
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="notifications" size={24} color={COLORS.secondary} />
                                    </View>
                                    <Text style={styles.menuText}>Mes Notifications</Text>
                                </TouchableOpacity>
                                <View style={styles.separator} />

                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => handleNavigation('Favoris')}
                                >
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="heart" size={24} color={COLORS.secondary} />
                                    </View>
                                    <Text style={styles.menuText}>Mes Favoris</Text>
                                </TouchableOpacity>
                                <View style={styles.separator} />

                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => handleNavigation('Profil')}
                                >
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="person" size={24} color={COLORS.secondary} />
                                    </View>
                                    <Text style={styles.menuText}>Mon Profil</Text>
                                </TouchableOpacity>
                                <View style={styles.separator} />

                                {/* MENU SPECIFIQUE ADMIN */}
                                {role === 'ADMIN' && (
                                    <>
                                        <TouchableOpacity
                                            style={styles.menuItem}
                                            onPress={() => handleNavigation('AdminDashboard', { initialTab: 'dashboard' })}
                                        >
                                            <View style={styles.iconContainer}>
                                                <Ionicons name="shield" size={24} color={COLORS.secondary} />
                                            </View>
                                            <Text style={styles.menuText}>Tableau de bord</Text>
                                        </TouchableOpacity>
                                        <View style={styles.separator} />


                                    </>
                                )}

                                {/* Déconnexion */}
                                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="log-out-outline" size={24} color="#E53935" />
                                    </View>
                                    <Text style={[styles.menuText, { color: '#E53935' }]}>Se Déconnecter</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {/* Options Visiteur */}
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => handleNavigation('Login')}
                                >
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="log-in" size={24} color={COLORS.secondary} />
                                    </View>
                                    <Text style={styles.menuText}>Se Connecter</Text>
                                </TouchableOpacity>
                                <View style={styles.separator} />

                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => handleNavigation('Inscription')}
                                >
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="person-add" size={24} color={COLORS.secondary} />
                                    </View>
                                    <Text style={styles.menuText}>S'inscrire</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                </View>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        flexDirection: 'row',
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    menuContainer: {
        width: 280,
        backgroundColor: COLORS.card,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        paddingTop: SPACING.xl + 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    avatarContainer: {
        marginRight: SPACING.md,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuTitle: {
        flex: 1,
        fontSize: SIZES.h2,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    menuItems: {
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    iconContainer: {
        width: 40,
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    menuText: {
        fontSize: SIZES.body,
        color: COLORS.text,
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: SPACING.lg,
    },
});

export default SideMenu;

