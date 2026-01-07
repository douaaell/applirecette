import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Modal,
    ScrollView,
    Image,
    TextInput,
    Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchRecettes, fetchMesRecettes } from '../redux/slices/recetteSlice';
import { logout, toggleFavori, fetchFavoris } from '../redux/slices/authSlice';
import { utilisateurAPI, recetteAPI, demandeModificationAPI, notificationAPI } from '../utils/api';
import RecetteCard from '../components/RecetteCard';
import SideMenu from '../components/SideMenu';

import {
    COLORS,
    SPACING,
    SIZES,
    FONTS,
    CATEGORIES,
    DIFFICULTES,
    TEMPS_PREPARATION
} from '../utils/constants';

const { width } = Dimensions.get('window');

const Accueil = ({ navigation }) => {
    const dispatch = useDispatch();
    const { recettes, loading } = useSelector((state) => state.recettes);
    const { isAuthenticated, role, user } = useSelector((state) => state.auth);

    // Debug: Afficher les recettes dans la console
    /* React.useEffect(() => {
    }, [recettes, loading]); */

    const [refreshing, setRefreshing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [notificationCount, setNotificationCount] = useState(0);

    // Filtres
    const [selectedCategorie, setSelectedCategorie] = useState('');
    const [selectedTemps, setSelectedTemps] = useState('');
    const [selectedDifficulte, setSelectedDifficulte] = useState('');
    const [selectedTri, setSelectedTri] = useState('recent');

    const loadRecettes = () => {
        // En mode Admin, charger toutes les recettes approuvées
        if (role === 'ADMIN') {
            dispatch(fetchRecettes()).then((result) => {
                if (result.type !== 'recettes/fetchRecettes/fulfilled') {
                    console.error('❌ Accueil - Erreur chargement recettes Admin:', result.error);
                }
            });
        } else {
            dispatch(fetchRecettes()).then((result) => {
                if (result.type !== 'recettes/fetchRecettes/fulfilled') {
                    console.error('❌ Accueil - Erreur chargement recettes:', result.error);
                }
            });
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchRecettes());
        if (isAuthenticated) {
            await dispatch(fetchFavoris());
            await calculateNotificationCount();
        }
        setRefreshing(false);
    };

    const handleFavorite = async (recetteId) => {
        if (!isAuthenticated) {
            navigation.navigate('Login');
            return;
        }
        dispatch(toggleFavori(recetteId));
    };

    // Calculer le nombre de notifications
    const calculateNotificationCount = async () => {
        if (!isAuthenticated) {
            setNotificationCount(0);
            return;
        }

        try {
            const response = await notificationAPI.getMesNotifications();
            const unreadCount = response.data.filter(n => !n.lu).length;
            setNotificationCount(unreadCount);
        } catch (error) {
            console.error('Erreur calcul notifications:', error);
            setNotificationCount(0);
        }
    };

    // Use effect for initial load
    useEffect(() => {
        loadRecettes();
        if (isAuthenticated) {
            dispatch(fetchFavoris());
            calculateNotificationCount();
        }
    }, [dispatch, isAuthenticated, role]);

    // Appliquer les filtres
    const getFilteredRecettes = () => {
        let filtered = [...recettes];

        // Recherche texte
        if (searchText) {
            filtered = filtered.filter(r =>
                r.titre.toLowerCase().includes(searchText.toLowerCase()) ||
                r.description?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        if (selectedCategorie) {
            filtered = filtered.filter((r) => r.categorie === selectedCategorie);
        }

        if (selectedTemps) {
            const [min, max] = selectedTemps.split('-').map(Number);
            if (max) {
                filtered = filtered.filter(
                    (r) => r.tempsPreparation >= min && r.tempsPreparation <= max
                );
            } else {
                filtered = filtered.filter((r) => r.tempsPreparation >= min);
            }
        }

        if (selectedDifficulte) {
            filtered = filtered.filter((r) => r.difficulte === selectedDifficulte);
        }

        switch (selectedTri) {
            case 'recent':
                filtered.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
                break;
            case 'populaire':
                filtered.sort((a, b) => (b.vues || 0) - (a.vues || 0));
                break;
            case 'note':
                filtered.sort((a, b) => (b.noteMoyenne || 0) - (a.noteMoyenne || 0));
                break;
            case 'temps-asc':
                filtered.sort((a, b) => a.tempsPreparation - b.tempsPreparation);
                break;
            case 'temps-desc':
                filtered.sort((a, b) => b.tempsPreparation - a.tempsPreparation);
                break;
        }

        return filtered;
    };

    const resetFilters = () => {
        setSelectedCategorie('');
        setSelectedTemps('');
        setSelectedDifficulte('');
        setSelectedTri('recent');
    };

    const handleNavigation = (screen) => {
        setShowMenu(false);
        navigation.navigate(screen);
    };

    const renderRecette = ({ item }) => (
        <View style={styles.cardContainer}>
            <RecetteCard
                recette={item}
                onPress={() => navigation.navigate('DetailRecette', { recetteId: item._id })}
                onFavoritePress={() => handleFavorite(item._id)}
                isFavorite={user?.favoris?.some(f => (f._id === item._id) || (f === item._id))}
                showStatus={isAuthenticated && (role === 'ADMIN' || item.auteur?._id === user?._id)}
            />
        </View>
    );

    const filteredRecettes = getFilteredRecettes();

    return (
        <View style={styles.container}>
            {/* Header - Mode Visiteur avec design spécifique */}
            {!isAuthenticated ? (
                <View style={styles.visitorHeader}>
                    <View style={styles.visitorHeaderTop}>
                        {/* Barre grise en haut avec icônes */}
                    </View>
                    <View style={styles.visitorHeaderMain}>
                        <View style={styles.visitorHeaderLeft}>
                            <TouchableOpacity onPress={() => setShowMenu(true)} style={{ marginRight: 10 }}>
                                <Ionicons name="menu-outline" size={28} color={COLORS.text} />
                            </TouchableOpacity>
                            <Ionicons name="restaurant" size={28} color={COLORS.secondary} />
                            <View style={styles.visitorHeaderTitleContainer}>
                                <Text style={styles.visitorHeaderTitle}>Mes Recettes</Text>
                                <Text style={styles.visitorHeaderSubtitle}>Cuisine avec passion</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.visitorLoginButton} onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.visitorLoginButtonText}>→ Connexion</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.userHeader}>
                    <View style={styles.userHeaderTop}>
                        <View style={styles.userHeaderLeft}>
                            <TouchableOpacity onPress={() => setShowMenu(true)} style={{ marginRight: 10 }}>
                                <Ionicons name="menu-outline" size={32} color={COLORS.secondary} />
                            </TouchableOpacity>
                            <Ionicons name="restaurant" size={28} color={COLORS.secondary} />
                            <View style={styles.userHeaderTitleContainer}>
                                <Text style={styles.userHeaderTitle}>Mes Recettes</Text>
                                {role === 'ADMIN' && (
                                    <Text style={styles.userHeaderSubtitle}>Cuisine avec passion</Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.userHeaderRight}>
                            <TouchableOpacity
                                style={styles.notificationButton}
                                onPress={() => navigation.navigate('Notifications')}
                            >
                                <View style={{ backgroundColor: '#F5F5F5', padding: 8, borderRadius: 20 }}>
                                    <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
                                </View>
                                {notificationCount > 0 && (
                                    <View style={styles.notificationBadge}>
                                        <Text style={styles.notificationBadgeText}>
                                            {notificationCount > 99 ? '99+' : notificationCount}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Nouvelle barre de recherche et actions (Style Image 2) */}
                    <View style={styles.userHeaderActions}>
                        <View style={styles.searchBarContainer}>
                            <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
                            <TextInput
                                style={styles.searchInputField}
                                placeholder="Rechercher une recette..."
                                placeholderTextColor={COLORS.textMuted}
                                value={searchText}
                                onChangeText={setSearchText}
                            />
                        </View>

                        <TouchableOpacity style={styles.iconButton} onPress={() => setShowFilters(true)}>
                            <Ionicons name="filter-outline" size={22} color={COLORS.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => navigation.navigate('AjouterRecette')}
                        >
                            <Ionicons name="add" size={24} color="#fff" />
                            <Text style={styles.addButtonText}>Ajouter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={styles.contentContainer}>
                {/* Search & Filters - Seulement pour visiteur */}
                {!isAuthenticated && (
                    <View style={styles.searchSection}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Rechercher une recette..."
                                value={searchText}
                                onChangeText={setSearchText}
                            />
                        </View>
                        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
                            <Text style={styles.filterBtnText}>Filtres</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Badge & Count - Seulement pour utilisateur connecté */}
                {isAuthenticated && (
                    <>

                        <Text style={styles.resultsCount}>
                            {filteredRecettes.length} recettes trouvées
                        </Text>
                    </>
                )}

                {/* Liste Grid */}
                <FlatList
                    key={'grid'}
                    data={filteredRecettes}
                    renderItem={renderRecette}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="restaurant-outline" size={64} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>
                                {loading ? 'Chargement...' : 'Aucune recette trouvée'}
                            </Text>
                        </View>
                    }
                />
            </View>

            {/* MENU LATÉRAL */}
            <SideMenu visible={showMenu} onClose={() => setShowMenu(false)} navigation={navigation} />

            {/* Modal Filtres */}
            <Modal visible={showFilters} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filtrer les recettes</Text>
                            <TouchableOpacity onPress={() => setShowFilters(false)}>
                                <Ionicons name="close" size={28} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.filterLabel}>Catégorie</Text>
                            <View style={styles.filterOptions}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.value}
                                        style={[styles.filterOption, selectedCategorie === cat.value && styles.filterOptionActive]}
                                        onPress={() => setSelectedCategorie(selectedCategorie === cat.value ? '' : cat.value)}
                                    >
                                        <Text style={[styles.filterOptionText, selectedCategorie === cat.value && styles.filterOptionTextActive]}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.filterLabel}>Temps de préparation</Text>
                            <View style={styles.filterOptions}>
                                {TEMPS_PREPARATION.map((temps) => (
                                    <TouchableOpacity
                                        key={temps.value}
                                        style={[styles.filterOption, selectedTemps === temps.value && styles.filterOptionActive]}
                                        onPress={() => setSelectedTemps(selectedTemps === temps.value ? '' : temps.value)}
                                    >
                                        <Text style={[styles.filterOptionText, selectedTemps === temps.value && styles.filterOptionTextActive]}>
                                            {temps.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.filterLabel}>Difficulté</Text>
                            <View style={styles.filterOptions}>
                                {DIFFICULTES.map((diff) => (
                                    <TouchableOpacity
                                        key={diff.value}
                                        style={[styles.filterOption, selectedDifficulte === diff.value && styles.filterOptionActive]}
                                        onPress={() => setSelectedDifficulte(selectedDifficulte === diff.value ? '' : diff.value)}
                                    >
                                        <Text style={[styles.filterOptionText, selectedDifficulte === diff.value && styles.filterOptionTextActive]}>
                                            {diff.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                                    <Text style={styles.resetButtonText}>Effacer</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilters(false)}>
                                    <Text style={styles.applyButtonText}>Voir les résultats</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    // Header Visiteur
    visitorHeader: {
        backgroundColor: '#fff',
    },
    visitorHeaderTop: {
        height: 30,
        backgroundColor: '#2C2C2C',
        width: '100%',
    },
    visitorHeaderMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.md,
        backgroundColor: '#fff',
    },
    visitorHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    visitorHeaderTitleContainer: {
        marginLeft: SPACING.sm,
    },
    visitorHeaderTitle: {
        fontSize: FONTS.sizes.xl,
        fontWeight: 'bold',
        color: COLORS.secondary,
    },
    visitorHeaderSubtitle: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    visitorLoginButton: {
        backgroundColor: COLORS.secondary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: SIZES.borderRadius,
    },
    visitorLoginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: FONTS.sizes.sm,
    },
    // Header Utilisateur
    userHeader: {
        backgroundColor: '#fff',
        paddingTop: SPACING.xl + 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 2,
    },
    userHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    userHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userHeaderTitleContainer: {
        marginLeft: SPACING.sm,
    },
    userHeaderTitle: {
        fontSize: FONTS.sizes.xl,
        fontWeight: 'bold',
        color: COLORS.secondary,
    },
    userHeaderSubtitle: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    userHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
        marginLeft: SPACING.md,
    },
    userSearchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: SPACING.sm,
        flex: 1,
        maxWidth: 200,
    },
    userSearchInput: {
        flex: 1,
        fontSize: FONTS.sizes.sm,
        color: COLORS.text,
        marginLeft: 6,
    },
    notificationButton: {
        position: 'relative',
        marginRight: SPACING.sm,
        padding: 4,
    },
    notificationBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.error,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    notificationBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    userProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: SPACING.xs,
    },
    userHeaderAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 6,
    },
    userHeaderAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    userAvatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    userNameText: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.text,
        fontWeight: '500',
        marginRight: 4,
    },
    adminAvatarPlaceholder: {
        backgroundColor: COLORS.secondary,
    },
    adminBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginRight: 4,
    },
    adminBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    userHeaderActions: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        gap: SPACING.sm,
    },
    userFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.borderRadius,
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        gap: 6,
    },
    userFilterBtnText: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: FONTS.sizes.sm,
    },
    userAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        borderRadius: SIZES.borderRadius,
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        gap: 6,
    },
    userAddBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: FONTS.sizes.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.xl + 10,
        paddingBottom: SPACING.md,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 2,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONTS.sizes.xl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginLeft: 8,
    },
    loginButton: {
        backgroundColor: COLORS.secondary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: SIZES.borderRadius,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: FONTS.sizes.sm,
    },
    headerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    headerAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
    },
    contentContainer: {
        flex: 1,
        paddingTop: SPACING.md,
    },
    searchSection: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.md,
        alignItems: 'center',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: SIZES.borderRadius,
        paddingHorizontal: SPACING.md,
        height: 45,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: SPACING.sm,
    },
    searchIcon: {
        marginRight: SPACING.xs,
    },
    searchInput: {
        flex: 1,
        fontSize: FONTS.sizes.md,
        color: COLORS.text,
    },
    filterBtn: {
        backgroundColor: '#fff',
        height: 45,
        paddingHorizontal: SPACING.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: SIZES.borderRadius,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterBtnText: {
        color: COLORS.text,
        fontWeight: '600',
    },
    statusRow: {
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.sm,
    },
    modeBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modeLabel: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textLight,
        marginRight: SPACING.xs,
    },
    modeBadge: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    modeBadgeUser: {
        backgroundColor: '#E3F2FD',
    },
    modeBadgeAdmin: {
        backgroundColor: '#E1BEE7',
    },
    modeText: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.text,
        fontWeight: '500',
    },
    resultsCount: {
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.md,
        color: COLORS.textLight,
        fontSize: FONTS.sizes.md,
    },
    list: {
        paddingHorizontal: SPACING.md,
        paddingBottom: 20,
    },
    // GRID STYLES
    row: {
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    cardContainer: {
        width: '48%', // Creates 2 columns with spacing
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
    },
    // New Header Styles
    searchBarContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    searchInputField: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: COLORS.text,
        height: '100%',
    },
    iconButton: {
        width: 48,
        height: 48,
        backgroundColor: '#fff',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary, // Orange
        paddingHorizontal: 16,
        height: 48,
        borderRadius: 12,
        gap: 6,
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },

    emptyText: {
        marginTop: SPACING.md,
        color: COLORS.textMuted,
        fontSize: FONTS.sizes.md,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: FONTS.sizes.lg,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: SPACING.md,
    },
    filterLabel: {
        fontSize: FONTS.sizes.md,
        fontWeight: 'bold',
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    filterOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
        marginBottom: 8,
    },
    filterOptionActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterOptionText: {
        fontSize: 14,
        color: COLORS.text,
    },
    filterOptionTextActive: {
        color: 'white',
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: SPACING.xl,
        marginBottom: 40,
        gap: 10,
    },
    resetButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
    },
    resetButtonText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    applyButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
    },
    applyButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    // Menu Modal Styles
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
    },
    menuBackdrop: {
        flex: 1,
    },
    menuContent: {
        width: '80%',
        backgroundColor: 'white',
        height: '100%',
        paddingTop: SPACING.xl,
    },
    menuHeaderNew: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        paddingTop: SPACING.xl,
        backgroundColor: '#F5F5F5',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    menuAvatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        marginRight: SPACING.md,
    },
    menuAvatar: {
        width: '100%',
        height: '100%',
    },
    menuTitleNew: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2C3E50',
        flex: 1,
    },
    menuItemsNew: {
        paddingVertical: 10,
    },
    menuItemNew: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: SPACING.md,
    },
    menuIconContainer: {
        width: 30,
        alignItems: 'center',
        marginRight: 15,
    },
    menuTextNew: {
        fontSize: 16,
        color: '#2C3E50',
        fontWeight: '600',
    },
    menuSeparator: {
        height: 1,
        backgroundColor: '#EEEEEE',
        marginLeft: 60,
    },
    closeIcon: {
        padding: 5,
    },
});

export default Accueil;
