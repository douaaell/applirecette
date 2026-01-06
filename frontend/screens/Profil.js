import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    RefreshControl,
    Image,
    ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../redux/slices/authSlice';
import { fetchMesRecettes } from '../redux/slices/recetteSlice';
import { commentaireAPI } from '../utils/api';
import { COLORS, SPACING, SIZES, FONTS, ROLES } from '../utils/constants';
import { useFocusEffect } from '@react-navigation/native';
import SideMenu from '../components/SideMenu';

const Profil = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user, role } = useSelector((state) => state.auth);
    const { mesRecettes, loading: loadingRecettes } = useSelector((state) => state.recettes);

    // Debug: Afficher le rôle dans la console
    React.useEffect(() => {
        console.log('🔍 Profil - Rôle depuis Redux:', role);
        console.log('🔍 Profil - Rôle depuis user:', user?.role);
        console.log('🔍 Profil - User complet:', user);
    }, [role, user]);

    const [mesCommentaires, setMesCommentaires] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const loadData = async () => {
        dispatch(fetchMesRecettes());
        fetchMyComments();
    };

    const fetchMyComments = async () => {
        try {
            setLoadingComments(true);
            const res = await commentaireAPI.getMesCommentaires();
            setMesCommentaires(res.data);
        } catch (error) {
            console.error('Erreur commentaires:', error);
            if (error.response && error.response.status === 404) {
                // Si 404, c'est que la nouvelle route n'est pas encore chargée par le serveur
                Alert.alert("Mise à jour nécessaire", "Veuillez redémarrer votre serveur backend (terminal: npm start) pour activer l'affichage des commentaires.");
            }
        } finally {
            setLoadingComments(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([dispatch(fetchMesRecettes()).unwrap(), fetchMyComments()]);
        setRefreshing(false);
    };

    const handleLogout = () => {
        Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnexion', style: 'destructive', onPress: () => dispatch(logout()) },
        ]);
    };

    const recettesEnAttente = mesRecettes?.filter(r => r.statut === 'EN_ATTENTE') || [];
    const recettesApprouvees = mesRecettes?.filter(r => r.statut === 'APPROUVEE') || [];

    const StatItem = ({ count, label, color }) => (
        <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color }]}>{count}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    const RecipeRow = ({ item, statusColor, statusLabel, bgTint }) => (
        <TouchableOpacity
            style={[styles.recipeRow, { backgroundColor: bgTint }]}
            onPress={() => navigation.navigate('DetailRecette', { recetteId: item._id })}
        >
            {item.image ? (
                <Image
                    source={{ uri: item.image }}
                    style={styles.recipeThumb}
                />
            ) : (
                <View style={[styles.recipeThumb, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0E0E0' }]}>
                    <Ionicons name="restaurant" size={24} color="#999" />
                </View>
            )}
            <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle} numberOfLines={1}>{item.titre}</Text>
                <Text style={styles.recipeMeta}>{item.categorie} • {item.tempsPreparation} min</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
        </TouchableOpacity>
    );

    const CommentRow = ({ item }) => (
        <View style={styles.commentCard}>
            <View style={styles.commentHeader}>
                <Text style={styles.commentTarget}>
                    Sur : <Text
                        style={[styles.recipeLink, !item.recette?._id && { color: '#999', textDecorationLine: 'none' }]}
                        onPress={() => {
                            if (item.recette?._id) {
                                navigation.navigate('DetailRecette', { recetteId: item.recette._id });
                            } else {
                                Alert.alert('Info', 'Cette recette n\'est plus disponible.');
                            }
                        }}
                    >
                        {item.recette?.titre || 'Recette indisponible'}
                    </Text>
                </Text>
                <Text style={styles.commentDate}>
                    {new Date(item.date).toLocaleDateString()}
                </Text>
            </View>
            <Text style={styles.commentContent}>{item.contenu}</Text>
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {/* Header Card */}
                <View style={styles.headerCard}>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
                            <Ionicons name="menu" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.headerTop, { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }]}>
                        <View style={[styles.avatar, { marginRight: 0, marginBottom: 12 }]}>
                            {user?.photoURL ? (
                                <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
                            ) : (
                                <Ionicons name="person" size={40} color={COLORS.secondary} />
                            )}
                        </View>
                        <View style={[styles.userInfo, { alignItems: 'center' }]}>
                            <Text style={[styles.userName, { textAlign: 'center' }]}>
                                {role === ROLES.ADMIN || user?.role === ROLES.ADMIN
                                    ? 'Admin Chef'
                                    : (user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : user?.nom || 'Utilisateur')}
                            </Text>
                            <Text style={[styles.userEmail, { textAlign: 'center' }]}>{user?.email}</Text>
                            <View style={[styles.roleBadge, (role === ROLES.ADMIN || user?.role === ROLES.ADMIN) && styles.roleBadgeAdmin, { alignSelf: 'center' }]}>
                                <Text style={[styles.roleText, (role === ROLES.ADMIN || user?.role === ROLES.ADMIN) && styles.roleTextAdmin]}>
                                    {role === ROLES.ADMIN || user?.role === ROLES.ADMIN ? 'Administrateur' : 'Utilisateur'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <StatItem count={mesRecettes?.length || 0} label="Recettes" color="#FF8C42" />
                        <StatItem count={recettesApprouvees.length} label="Approuvées" color="#4CAF50" />
                        <StatItem count={mesCommentaires.length} label="Commentaires" color="#2196F3" />
                    </View>
                </View>

                {/* Mes Recettes */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="book" size={20} color={COLORS.secondary} />
                        <Text style={styles.sectionTitle}>Mes recettes ({mesRecettes?.length || 0})</Text>
                    </View>

                    {/* En Attente Subsection */}
                    {recettesEnAttente.length > 0 && (
                        <View style={styles.subSection}>
                            <Text style={[styles.subTitle, { color: '#FFA000' }]}>En attente de validation ({recettesEnAttente.length})</Text>
                            {recettesEnAttente.map(recipe => (
                                <RecipeRow
                                    key={recipe._id}
                                    item={recipe}
                                    statusLabel="En attente"
                                    statusColor="#FFA000"
                                    bgTint="#FFF8E1"
                                />
                            ))}
                        </View>
                    )}

                    {/* Approuvées Subsection */}
                    {recettesApprouvees.length > 0 && (
                        <View style={styles.subSection}>
                            <Text style={[styles.subTitle, { color: '#4CAF50' }]}>Approuvées ({recettesApprouvees.length})</Text>
                            {recettesApprouvees.map(recipe => (
                                <RecipeRow
                                    key={recipe._id}
                                    item={recipe}
                                    statusLabel="Approuvée"
                                    statusColor="#4CAF50"
                                    bgTint="#E8F5E9"
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* Mes Commentaires Section */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="chatbubble" size={20} color="#2196F3" />
                        <Text style={styles.sectionTitle}>Mes commentaires ({mesCommentaires.length})</Text>
                    </View>

                    {mesCommentaires.length === 0 ? (
                        <Text style={styles.emptyText}>Aucun commentaire</Text>
                    ) : (
                        mesCommentaires.map(comment => (
                            <CommentRow key={comment._id} item={comment} />
                        ))
                    )}
                </View>

            </ScrollView>

            {/* MENU LATÉRAL */}
            <SideMenu visible={showMenu} onClose={() => setShowMenu(false)} navigation={navigation} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 16,
    },
    headerCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButtonText: {
        marginLeft: 4,
        fontSize: FONTS.sizes.md,
        color: COLORS.text,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 35,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    userEmail: {
        fontSize: 14,
        color: '#888',
        marginBottom: 4,
    },
    roleBadge: {
        backgroundColor: '#E3F2FD',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 4,
    },
    roleBadgeAdmin: {
        backgroundColor: COLORS.primary,
    },
    roleText: {
        color: '#2196F3',
        fontSize: 12,
        fontWeight: '600',
    },
    roleTextAdmin: {
        color: '#fff',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
    },
    sectionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    subSection: {
        marginBottom: 20,
    },
    subTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    recipeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: 'white',
    },
    recipeThumb: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#EEE',
    },
    recipeInfo: {
        flex: 1,
        marginLeft: 12,
    },
    recipeTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    recipeMeta: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
        textTransform: 'capitalize',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    commentCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.secondary,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    commentTarget: {
        fontSize: 12,
        color: '#555',
    },
    recipeLink: {
        color: '#FF8C42',
        fontWeight: 'bold',
    },
    commentDate: {
        fontSize: 12,
        color: '#999',
    },
    commentContent: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    emptyText: {
        fontStyle: 'italic',
        color: '#999',
        marginLeft: 28,
    },
});

export default Profil;
