import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ScrollView,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { toggleFavori, fetchFavoris } from '../redux/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { utilisateurAPI } from '../utils/api';
import RecetteCard from '../components/RecetteCard';
import SideMenu from '../components/SideMenu';
import { COLORS, SPACING, SIZES, FONTS } from '../utils/constants';

// Activer LayoutAnimation sur Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const Favoris = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const favoris = user?.favoris || [];

    const [filteredFavoris, setFilteredFavoris] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const [activeTab, setActiveTab] = useState('tous'); // 'tous', 'ecrites', 'autres'

    useEffect(() => {
        dispatch(fetchFavoris());
    }, []);

    // Effet pour filtrer quand l'onglet ou les favoris changent
    useEffect(() => {
        filterFavoris();
    }, [activeTab, favoris]);

    const filterFavoris = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        if (activeTab === 'tous') {
            setFilteredFavoris(favoris);
        } else if (activeTab === 'ecrites') {
            // Recettes créées par l'utilisateur (si l'objet auteur est populé ou si c'est juste l'ID)
            const ecrites = favoris.filter(r => {
                const auteurId = r.auteur?._id || r.auteur;
                return auteurId === user?._id;
            });
            setFilteredFavoris(ecrites);
        } else if (activeTab === 'autres') {
            // Recettes des autres
            const autres = favoris.filter(r => {
                const auteurId = r.auteur?._id || r.auteur;
                return auteurId !== user?._id;
            });
            setFilteredFavoris(autres);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchFavoris());
        setRefreshing(false);
    };

    const handleRemoveFavori = (recetteId) => {
        dispatch(toggleFavori(recetteId));
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const renderRecette = ({ item }) => (
        <View style={styles.cardContainer}>
            <RecetteCard
                recette={item}
                onPress={() => navigation.navigate('DetailRecette', { recetteId: item._id })}
                onFavoritePress={() => handleRemoveFavori(item._id)}
                isFavorite={true}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
                    <Ionicons name="menu-outline" size={28} color={COLORS.secondary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Mes Favoris</Text>
                    <Text style={styles.headerSubtitle}>
                        {filteredFavoris.length} recette{filteredFavoris.length > 1 ? 's' : ''}
                    </Text>
                </View>
                {/* Espace vide pour équilibrer le menu à gauche, ou icône recherche si besoin */}
                <View style={{ width: 28 }} />
            </View>

            {/* Onglets Filter */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'tous' && styles.tabActive]}
                        onPress={() => handleTabChange('tous')}
                    >
                        <Text style={[styles.tabText, activeTab === 'tous' && styles.tabTextActive]}>
                            Toutes
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'ecrites' && styles.tabActive]}
                        onPress={() => handleTabChange('ecrites')}
                    >
                        <Text style={[styles.tabText, activeTab === 'ecrites' && styles.tabTextActive]}>
                            Mes Créations
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'autres' && styles.tabActive]}
                        onPress={() => handleTabChange('autres')}
                    >
                        <Text style={[styles.tabText, activeTab === 'autres' && styles.tabTextActive]}>
                            Autres
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Liste */}
            <FlatList
                data={filteredFavoris}
                renderItem={renderRecette}
                keyExtractor={(item) => item._id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="heart-outline" size={64} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>
                            Aucun favori
                        </Text>
                        <Text style={styles.emptySubtext}>
                            Appuyez sur le cœur pour ajouter une recette à vos favoris.
                        </Text>
                    </View>
                }
            />
            <SideMenu visible={showMenu} onClose={() => setShowMenu(false)} navigation={navigation} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    // ... (header styles inchangés)
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
    menuButton: {
        padding: 4,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONTS.sizes.xl,
        fontWeight: 'bold',
        color: COLORS.secondary,
    },
    headerSubtitle: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    // GRID STYLES
    list: {
        paddingHorizontal: SPACING.md, // Ajusté pour aligner avec Accueil
        paddingBottom: 20,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    cardContainer: {
        width: '48%', // Crée 2 colonnes avec espacement
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: SPACING.lg,
    },
    emptyText: {
        fontSize: FONTS.sizes.lg,
        fontWeight: 'bold',
        color: COLORS.textMuted,
        marginTop: SPACING.md,
    },
    emptySubtext: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textLight,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    // Styles Onglets
    tabsContainer: {
        backgroundColor: '#fff',
        paddingBottom: SPACING.sm,
    },
    tabsScroll: {
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.sm,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: SPACING.sm,
        backgroundColor: '#F0F0F0',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    tabActive: {
        backgroundColor: COLORS.secondary,
    },
    tabText: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.text,
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default Favoris;
