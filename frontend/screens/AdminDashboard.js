import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    FlatList,
    Image,
    Dimensions,
    Modal,
    TextInput,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { recetteAPI, utilisateurAPI, commentaireAPI, demandeModificationAPI, signalementAPI } from '../utils/api';
import { fetchRecettes } from '../redux/slices/recetteSlice';
import { logout } from '../redux/slices/authSlice';
import { COLORS, SPACING, SIZES, FONTS } from '../utils/constants';
import SideMenu from '../components/SideMenu';

const { width } = Dimensions.get('window');

const AdminDashboard = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    // States Data
    const [stats, setStats] = useState({
        totalUtilisateurs: 0,
        totalRecettesApprouvees: 0,
        totalRecettesEnAttente: 0,
        totalCommentaires: 0,
    });
    const [recettesEnAttente, setRecettesEnAttente] = useState([]);
    const [recettesApprouvees, setRecettesApprouvees] = useState([]);
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [commentaires, setCommentaires] = useState([]);
    const [demandesModification, setDemandesModification] = useState([]);
    const [signalements, setSignalements] = useState([]);

    // UI States
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, recettes, utilisateurs, commentaires, signalements
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refusModalVisible, setRefusModalVisible] = useState(false);
    const [refusRecetteId, setRefusRecetteId] = useState(null);
    const [refusRaison, setRefusRaison] = useState('');
    const [showMenu, setShowMenu] = useState(false);

    // Initial Load & Route Param Handling
    useEffect(() => {
        if (route.params?.initialTab) {
            setActiveTab(route.params.initialTab);
        }
        loadAllData();
    }, [route.params]);

    const loadAllData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadStats(),
                loadRecettes(),
                loadUtilisateurs(),
                loadCommentaires(),
                loadDemandesModification(),
                loadSignalements(),
            ]);
        } catch (error) {
            console.error('Erreur chargement données admin:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await utilisateurAPI.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Erreur stats:', error);
        }
    };

    const loadRecettes = async () => {
        try {
            const response = await recetteAPI.getAllRecettesAdmin();
            const all = response.data;
            setRecettesEnAttente(all.filter((r) => r.statut === 'EN_ATTENTE'));
            setRecettesApprouvees(all.filter((r) => r.statut === 'APPROUVEE'));
        } catch (error) {
            console.error('Erreur recettes:', error);
        }
    };

    const loadUtilisateurs = async () => {
        try {
            setError(null);
            const response = await utilisateurAPI.getAllUtilisateurs();
            setUtilisateurs(response.data);
        } catch (error) {
            console.error('Erreur utilisateurs:', error);
            setError('Impossible de charger les utilisateurs. Vérifiez vos droits administrateur.');
        }
    };

    const loadCommentaires = async () => {
        try {
            const response = await commentaireAPI.getAllCommentaires();
            setCommentaires(response.data);
        } catch (error) {
            console.error('Erreur commentaires:', error);
        }
    };

    const loadDemandesModification = async () => {
        try {
            const response = await demandeModificationAPI.getAll();
            setDemandesModification(response.data);
        } catch (error) {
            console.error('Erreur demandes modification:', error);
        }
    };

    const loadSignalements = async () => {
        try {
            const response = await signalementAPI.getAll();
            setSignalements(response.data);
        } catch (error) {
            console.error('Erreur signalements:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAllData();
        setRefreshing(false);
    };

    // --- ACTIONS ---

    const handleValiderRecette = async (recetteId) => {
        try {
            await recetteAPI.validerRecette(recetteId);
            Alert.alert('Succès', 'Recette validée');
            loadRecettes();
            loadStats();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de valider la recette');
        }
    };

    const handleRefuserRecette = async (recetteId) => {
        console.log('🔍 handleRefuserRecette appelé avec ID:', recetteId);
        setRefusRecetteId(recetteId);
        setRefusRaison('');
        setRefusModalVisible(true);
    };

    const confirmRefus = async () => {
        try {
            console.log('📤 Refus de la recette:', refusRecetteId, 'raison:', refusRaison);
            await recetteAPI.refuserRecette(refusRecetteId, refusRaison || 'Non conforme');
            console.log('✅ Recette refusée avec succès');
            Alert.alert('Succès', 'Recette refusée');
            setRefusModalVisible(false);
            loadRecettes();
            loadStats();
        } catch (error) {
            console.error('❌ Erreur refus recette:', error);
            console.error('❌ Détails erreur:', error.response?.data);
            Alert.alert('Erreur', 'Impossible de refuser la recette');
        }
    };

    const handleSupprimerRecette = async (recetteId) => {
        console.log('🔴 BOUTON SUPPRIMER CLIQUÉ - ID:', recetteId);

        const executeDelete = async () => {
            try {
                console.log('🗑️ Tentative de suppression de la recette:', recetteId);

                const res = await recetteAPI.deleteRecette(recetteId);
                console.log('✅ Résultat suppression:', res.status, res.data);

                // Mettre à jour l'état local immédiatement
                setRecettesApprouvees(prev => prev.filter(r => r._id !== recetteId));
                setRecettesEnAttente(prev => prev.filter(r => r._id !== recetteId));

                // Recharger les données
                await loadRecettes();
                await loadStats();

                if (Platform.OS === 'web') alert('✅ Recette supprimée avec succès !');
                else Alert.alert('Succès', 'Recette supprimée avec succès !');

            } catch (err) {
                console.error('❌ Erreur lors de la suppression:', err);
                const errorMsg = err.response?.data?.message || err.message || 'Erreur inconnue';
                if (Platform.OS === 'web') alert('❌ Erreur: ' + errorMsg);
                else Alert.alert('Erreur', errorMsg);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.')) {
                await executeDelete();
            }
        } else {
            Alert.alert(
                'Confirmer la suppression',
                'Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.',
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Supprimer', style: 'destructive', onPress: executeDelete }
                ]
            );
        }
    };

    const handleChangerRole = async (userId, currentRole) => {
        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        const executeChange = async () => {
            try {
                await utilisateurAPI.changerRole(userId, newRole);
                await loadUtilisateurs();
                if (Platform.OS === 'web') alert('Succès: Rôle mis à jour');
                else Alert.alert('Succès', 'Rôle mis à jour');
            } catch (error) {
                const msg = 'Impossible de modifier le rôle';
                if (Platform.OS === 'web') alert('Erreur: ' + msg);
                else Alert.alert('Erreur', msg);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Passer cet utilisateur en ${newRole} ?`)) {
                await executeChange();
            }
        } else {
            Alert.alert(
                'Changer le rôle',
                `Passer cet utilisateur en ${newRole} ?`,
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Confirmer', onPress: executeChange },
                ]
            );
        }
    };

    const handleSupprimerUtilisateur = async (userId) => {
        const executeDelete = async () => {
            try {
                await utilisateurAPI.deleteUtilisateur(userId);
                await loadUtilisateurs();
                await loadStats();
                if (Platform.OS === 'web') alert('Succès: Utilisateur supprimé');
                else Alert.alert('Succès', 'Utilisateur supprimé');
            } catch (error) {
                const msg = 'Echec suppression';
                if (Platform.OS === 'web') alert('Erreur: ' + msg);
                else Alert.alert('Erreur', msg);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Supprimer cet utilisateur ? Action irréversible.')) {
                await executeDelete();
            }
        } else {
            Alert.alert(
                'Supprimer l\'utilisateur',
                'Irréversible. Continuer ?',
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Supprimer', style: 'destructive', onPress: executeDelete },
                ]
            );
        }
    };

    const handleSupprimerCommentaire = async (commentId) => {
        const executeDelete = async () => {
            try {
                await commentaireAPI.deleteCommentaire(commentId);
                await loadCommentaires();
                await loadStats();
                if (Platform.OS === 'web') {
                    // Feedback visuel optionnel sur web, le re-render suffit souvent
                } else {
                    Alert.alert('Succès', 'Commentaire supprimé');
                }
            } catch (error) {
                console.error('Erreur suppression commentaire:', error);
                const msg = 'Echec suppression';
                if (Platform.OS === 'web') alert('Erreur: ' + msg);
                else Alert.alert('Erreur', msg);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Supprimer ce commentaire ?')) {
                await executeDelete();
            }
        } else {
            Alert.alert(
                'Supprimer',
                'Supprimer ce commentaire ?',
                [
                    { text: 'Annuler', style: 'cancel' },
                    {
                        text: 'Supprimer',
                        style: 'destructive',
                        onPress: executeDelete,
                    },
                ]
            );
        }
    };

    const handleSyncUsers = async () => {
        try {
            setLoading(true);
            const response = await utilisateurAPI.syncAllUsers();
            Alert.alert('Succès', response.data.message);
            loadUtilisateurs();
            loadStats();
        } catch (error) {
            Alert.alert('Erreur', 'Echec de la synchronisation');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };



    const handleCleanupFirebase = async () => {
        const executeCleanup = async () => {
            try {
                setLoading(true);
                const response = await utilisateurAPI.cleanupFirebaseUsers();
                const msg = response.data.message;
                if (Platform.OS === 'web') alert('Succès: ' + msg);
                else Alert.alert('Succès', msg);

                await loadStats();
            } catch (error) {
                console.error('Erreur nettoyage:', error);
                const errorDetails = error.response?.data?.message || error.message || 'Erreur inconnue';
                const msg = 'Echec du nettoyage Firebase: ' + errorDetails;

                if (Platform.OS === 'web') alert('Erreur: ' + msg);
                else Alert.alert('Erreur', msg);
            } finally {
                setLoading(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Voulez-vous supprimer les utilisateurs Firebase qui n\'existent plus dans l\'application (orphelins) ? Attention, ceci est irréversible.')) {
                await executeCleanup();
            }
        } else {
            Alert.alert(
                'Nettoyage Firebase',
                'Supprimer les orphelins ?',
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Confirmer', onPress: executeCleanup },
                ]
            );
        }
    };

    const handleLogout = async () => {
        await dispatch(logout());
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    // --- RENDERERS ---

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => setShowMenu(true)} style={{ marginRight: 10 }}>
                        <Ionicons name="menu" size={32} color="white" />
                    </TouchableOpacity>
                    <Ionicons name="shield" size={32} color="white" />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={styles.headerTitle}>Administration</Text>
                        <Text style={styles.headerSubtitle}>Connecté en tant que Admin Chef</Text>
                    </View>
                </View>

            </View>

            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
                        onPress={() => setActiveTab('dashboard')}
                    >
                        <Ionicons name="shield" size={18} color={activeTab === 'dashboard' ? COLORS.primary : COLORS.text} />
                        <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>Tableau de bord</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'recettes' && styles.tabItemActive]}
                        onPress={() => setActiveTab('recettes')}
                    >
                        <Ionicons name="book" size={18} color={activeTab === 'recettes' ? COLORS.primary : COLORS.text} />
                        <Text style={[styles.tabText, activeTab === 'recettes' && styles.tabTextActive]}>
                            Recettes {recettesEnAttente.length > 0 ? `(${recettesEnAttente.length} en attente)` : ''}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'utilisateurs' && styles.tabItemActive]}
                        onPress={() => setActiveTab('utilisateurs')}
                    >
                        <Ionicons name="people" size={18} color={activeTab === 'utilisateurs' ? COLORS.primary : COLORS.text} />
                        <Text style={[styles.tabText, activeTab === 'utilisateurs' && styles.tabTextActive]}>Utilisateurs</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'commentaires' && styles.tabItemActive]}
                        onPress={() => setActiveTab('commentaires')}
                    >
                        <Ionicons name="chatbubble" size={18} color={activeTab === 'commentaires' ? COLORS.primary : COLORS.text} />
                        <Text style={[styles.tabText, activeTab === 'commentaires' && styles.tabTextActive]}>Commentaires</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'modifications' && styles.tabItemActive]}
                        onPress={() => setActiveTab('modifications')}
                    >
                        <Ionicons name="document-text" size={18} color={activeTab === 'modifications' ? COLORS.primary : COLORS.text} />
                        <Text style={[styles.tabText, activeTab === 'modifications' && styles.tabTextActive]}>Demandes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'signalements' && styles.tabItemActive]}
                        onPress={() => setActiveTab('signalements')}
                    >
                        <Ionicons name="flag" size={18} color={activeTab === 'signalements' ? COLORS.primary : COLORS.text} />
                        <Text style={[styles.tabText, activeTab === 'signalements' && styles.tabTextActive]}>
                            Signalements {signalements.length > 0 ? `(${signalements.length})` : ''}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );

    const handleApprouverDemande = async (demandeId) => {
        try {
            await demandeModificationAPI.approuver(demandeId);
            Alert.alert('Succès', 'Demande approuvée et appliquée');
            await loadAllData();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible d\'approuver la demande');
        }
    };

    const handleRejeterDemande = async (demandeId) => {
        console.log('🔍 handleRejeterDemande appelé avec ID:', demandeId);

        // Logique cross-platform
        let raison = '';

        if (Platform.OS === 'web') {
            raison = window.prompt('Raison du refus (optionnel):') || '';
            if (raison === null) return; // Annulation
        } else {
            // Sur Android/iOS, on utilise une approche plus simple ou Alert.prompt (iOS only)
            // Pour simplifier ici, on n'utilise pas prompt natif Android pour l'instant
            // Idéalement il faudrait une Modale custom comme fait ailleurs
            console.log('Note: Sur mobile hors iOS, la raison sera vide par défaut pour l\'instant');
        }

        try {
            console.log('📤 Rejet de la demande:', demandeId, 'raison:', raison);
            await demandeModificationAPI.rejeter(demandeId, raison);
            console.log('✅ Demande rejetée avec succès');

            if (Platform.OS === 'web') alert('Succès: Demande rejetée');
            else Alert.alert('Succès', 'Demande rejetée');

            await loadAllData();
        } catch (error) {
            console.error('❌ Erreur rejet demande:', error);
            const msg = 'Impossible de rejeter la demande';
            if (Platform.OS === 'web') alert('Erreur: ' + msg);
            else Alert.alert('Erreur', msg);
        }
    };

    const renderModificationsTab = () => (
        <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Gestion des demandes de modification ({demandesModification.length})</Text>

            {demandesModification.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>Aucune demande en attente.</Text>
                </View>
            ) : (
                demandesModification.map((item) => {
                    const recetteTitre = item.recette?.titre || 'Recette supprimée';
                    const auteurNom = item.auteur?.nom || 'Inconnu';
                    const auteurPrenom = item.auteur?.prenom || '';
                    const dateStr = new Date(item.dateCreation).toLocaleDateString('fr-FR');

                    // Générer la liste des changements pour les modifications
                    const changements = [];
                    if (item.type === 'modification' && item.modifications) {
                        const mods = item.modifications;
                        if (mods.titre) changements.push(`Nouveau titre : ${mods.titre}`);
                        if (mods.categorie) changements.push(`Nouvelle catégorie : ${mods.categorie}`);
                        if (mods.tempsPreparation) changements.push(`Nouveau temps : ${mods.tempsPreparation} min`);
                        if (mods.difficulte) changements.push(`Nouvelle difficulté : ${mods.difficulte}`);
                        if (mods.portions) changements.push(`Nouvelles portions : ${mods.portions}`);
                    }

                    return (
                        <View key={item._id} style={styles.modCard}>
                            <View style={styles.modHeader}>
                                <View>
                                    <Text style={styles.modTitle}>
                                        {item.type === 'modification' ? 'Demande de modification' : 'Demande de suppression'}
                                    </Text>
                                    <Text style={styles.modSubtitle}>
                                        Recette : <Text
                                            style={{ color: COLORS.secondary, textDecorationLine: 'underline' }}
                                            onPress={() => {
                                                const targetId = item.recette?._id || (typeof item.recette === 'string' ? item.recette : null);
                                                console.log('🔗 Navigation vers recette:', targetId, 'depuis item:', item.recette);
                                                if (targetId) navigation.navigate('DetailRecette', { recetteId: targetId });
                                                else alert('Erreur: ID recette introuvable');
                                            }}
                                        >
                                            {recetteTitre}
                                        </Text>
                                    </Text>
                                    <Text style={styles.modSubtitle}>
                                        Par : {auteurPrenom} {auteurNom} • {dateStr}
                                    </Text>
                                </View>
                                <View style={[styles.modBadge, item.type === 'modification' ? styles.badgeInfo : styles.badgeError]}>
                                    <Text style={[styles.modBadgeText, item.type === 'modification' ? styles.textInfo : styles.textError]}>
                                        {item.type === 'modification' ? 'Modification' : 'Suppression'}
                                    </Text>
                                </View>
                            </View>

                            {item.type === 'modification' && changements.length > 0 && (
                                <View style={styles.changesBox}>
                                    <Text style={styles.changesLabel}>Changements proposés :</Text>
                                    {changements.map((change, idx) => (
                                        <Text key={idx} style={styles.changeText}>• {change}</Text>
                                    ))}
                                </View>
                            )}

                            <View style={styles.modActions}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.btnSuccess]}
                                    onPress={() => handleApprouverDemande(item._id)}
                                >
                                    <Ionicons name="checkmark-circle" size={16} color="white" />
                                    <Text style={styles.actionBtnText}>Approuver</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.btnError]}
                                    onPress={() => handleRejeterDemande(item._id)}
                                >
                                    <Ionicons name="close-circle" size={16} color="white" />
                                    <Text style={styles.actionBtnText}>Rejeter</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })
            )}
        </View>
    );

    const renderDashboard = () => (
        <View style={styles.contentSection}>
            {/* Stats Cards */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <Text style={styles.statLabel}>Utilisateurs</Text>
                        <Ionicons name="people" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.statValue}>{stats.totalUtilisateurs}</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <Text style={styles.statLabel}>Recettes approuvées</Text>
                        <Ionicons name="book" size={20} color={COLORS.success} />
                    </View>
                    <Text style={styles.statValue}>{stats.totalRecettesApprouvees}</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <Text style={styles.statLabel}>En attente</Text>
                        <Ionicons name="time" size={20} color={COLORS.warning} />
                    </View>
                    <Text style={styles.statValue}>{stats.totalRecettesEnAttente}</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <Text style={styles.statLabel}>Commentaires</Text>
                        <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.statValue}>{stats.totalCommentaires}</Text>
                </View>
            </View>

            {/* Recent Pending */}
            <Text style={styles.sectionTitle}>Recettes en attente de validation</Text>
            {recettesEnAttente.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>Aucune recette en attente.</Text>
                </View>
            ) : (
                recettesEnAttente.slice(0, 3).map(renderRecetteEnAttenteItem)
            )}
            {recettesEnAttente.length > 3 && (
                <TouchableOpacity style={styles.viewMoreBtn} onPress={() => setActiveTab('recettes')}>
                    <Text style={styles.viewMoreText}>Voir tout</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderRecetteEnAttenteItem = (item) => (
        <View key={item._id} style={[styles.longCard, styles.longCardPending]}>
            <Image source={{ uri: item.image || 'https://placehold.co/100x100/png' }} style={styles.cardImage} />
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.titre}</Text>
                <Text style={styles.cardSubtitle}>
                    {item.categorie} • {item.tempsPreparation} min • {item.difficulte}
                </Text>
                <Text style={styles.cardAuthor}>Par {item.auteur?.prenom || ''} {item.auteur?.nom || 'Inconnu'}</Text>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity style={[styles.actionBtn, styles.btnSuccess]} onPress={() => handleValiderRecette(item._id)}>
                    <Ionicons name="checkmark" size={16} color="white" />
                    <Text style={styles.actionBtnText}>Approuver</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.btnError]} onPress={() => handleRefuserRecette(item._id)}>
                    <Ionicons name="close" size={16} color="white" />
                    <Text style={styles.actionBtnText}>Rejeter</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderRecetteApprouveeItem = (item) => (
        <View key={item._id} style={[styles.longCard, styles.longCardApproved]}>
            <Image source={{ uri: item.image || 'https://placehold.co/100x100/png' }} style={styles.cardImage} />
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.titre}</Text>
                <Text style={styles.cardSubtitle}>
                    {item.categorie} • {item.tempsPreparation} min • {item.difficulte}
                </Text>
                <Text style={styles.cardAuthor}>Par {item.auteur?.prenom || ''} {item.auteur?.nom || 'Inconnu'}</Text>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity style={[styles.actionBtn, styles.btnError]} onPress={() => handleSupprimerRecette(item._id)}>
                    <Ionicons name="trash" size={16} color="white" />
                    <Text style={styles.actionBtnText}>Supprimer</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderRecettesTab = () => (
        <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Recettes en attente ({recettesEnAttente.length})</Text>
            <View style={styles.listContainer}>
                {recettesEnAttente.map(renderRecetteEnAttenteItem)}
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Recettes approuvées ({recettesApprouvees.length})</Text>
            <View style={styles.listContainer}>
                {recettesApprouvees.map(renderRecetteApprouveeItem)}
            </View>
        </View>
    );

    const renderUtilisateursTab = () => (
        <View style={styles.contentSection}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: SPACING.lg,
                marginTop: SPACING.xs
            }}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Utilisateurs ({utilisateurs.length})</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.btnInfo, {
                            borderRadius: 30,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            elevation: 4,
                            shadowColor: '#33b5e5',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 3
                        }]}
                        onPress={handleSyncUsers}
                    >
                        <Ionicons name="sync" size={18} color="white" />
                        <Text style={[styles.actionBtnText, { fontSize: 13, fontWeight: '700' }]}>Synchroniser</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.btnWarning, {
                            borderRadius: 30,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            elevation: 4,
                            shadowColor: '#FF8800',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 3
                        }]}
                        onPress={handleCleanupFirebase}
                    >
                        <Ionicons name="trash-bin" size={18} color="white" />
                        <Text style={[styles.actionBtnText, { fontSize: 13, fontWeight: '700' }]}>Nettoyer</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {error && (
                <View style={[styles.emptyBox, { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2', borderWidth: 1 }]}>
                    <Text style={{ color: '#D32F2F' }}>{error}</Text>
                </View>
            )}

            {!error && utilisateurs.length === 0 && (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>
                </View>
            )}

            {utilisateurs.map((u) => (
                <View key={u._id} style={styles.userRow}>
                    <View>
                        <Text style={styles.userRowName}>{u.nom} {u.prenom}</Text>
                        <Text style={styles.userRowEmail}>{u.email}</Text>
                        <View style={[styles.badge, u.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeUser]}>
                            <Text style={styles.badgeText}>{u.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}</Text>
                        </View>
                    </View>
                    <View style={styles.userRowActions}>
                        {u.role !== 'ADMIN' ? (
                            <TouchableOpacity style={[styles.actionBtn, styles.btnInfo]} onPress={() => handleChangerRole(u._id, u.role)}>
                                <Ionicons name="arrow-up-circle" size={16} color="white" />
                                <Text style={styles.actionBtnText}>Promouvoir admin</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={[styles.actionBtn, styles.btnWarning]} onPress={() => handleChangerRole(u._id, u.role)}>
                                <Ionicons name="arrow-down-circle" size={16} color="white" />
                                <Text style={styles.actionBtnText}>Rétrograder</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[styles.actionBtn, styles.btnError]} onPress={() => handleSupprimerUtilisateur(u._id)}>
                            <Ionicons name="person-remove" size={16} color="white" />
                            <Text style={styles.actionBtnText}>Supprimer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderCommentairesTab = () => (
        <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Gestion des commentaires ({commentaires.length})</Text>
            {commentaires.map((c) => (
                <View key={c._id} style={styles.commentRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.commentUser}>{c.utilisateur?.nom} {c.utilisateur?.prenom}</Text>
                        <Text style={styles.commentTarget}>
                            Sur : <Text style={styles.commentTargetLink}>{c.recette?.titre}</Text>
                        </Text>
                        <Text style={styles.commentDate}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                        <Text style={styles.commentContent}>{c.contenu}</Text>
                    </View>
                    <TouchableOpacity style={[styles.actionBtn, styles.btnError, { alignSelf: 'flex-start' }]} onPress={() => handleSupprimerCommentaire(c._id)}>
                        <Ionicons name="trash" size={16} color="white" />
                        <Text style={styles.actionBtnText}>Supprimer</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );

    const renderSignalementsTab = () => (
        <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Contenus signalés ({signalements.length})</Text>

            {signalements.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>Aucun report en cours.</Text>
                </View>
            ) : (
                signalements.map((item) => (
                    <View key={item._id} style={styles.modCard}>
                        <View style={styles.modHeader}>
                            <View>
                                <Text style={styles.modTitle}>
                                    Type : {item.type}
                                </Text>
                                <Text style={styles.modSubtitle}>
                                    Motif : <Text style={{ fontWeight: 'bold', color: COLORS.error }}>{item.motif}</Text>
                                </Text>
                                <Text style={styles.modSubtitle}>
                                    Par : {item.auteur?.prenom} {item.auteur?.nom} • {new Date(item.date).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={[styles.modBadge, styles.badgeError]}>
                                <Text style={styles.textError}>A vériier</Text>
                            </View>
                        </View>

                        <View style={styles.modActions}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.btnInfo]}
                                onPress={() => {
                                    if (item.type === 'RECETTE') {
                                        navigation.navigate('DetailRecette', { recetteId: item.cibleId });
                                    } else {
                                        Alert.alert('Info', 'Veuillez vérifier manuellement le commentaire ID: ' + item.cibleId);
                                    }
                                }}
                            >
                                <Ionicons name="eye" size={16} color="white" />
                                <Text style={styles.actionBtnText}>Voir le contenu</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.btnError]}
                                onPress={() => {
                                    if (item.type === 'RECETTE') handleSupprimerRecette(item.cibleId);
                                    else handleSupprimerCommentaire(item.cibleId);
                                }}
                            >
                                <Ionicons name="trash" size={16} color="white" />
                                <Text style={styles.actionBtnText}>Supprimer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    const renderRefusModal = () => (
        <Modal visible={refusModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Refuser la recette</Text>
                    <Text style={styles.modalSubtitle}>Raison du refus (optionnel)</Text>
                    <TextInput
                        style={styles.modalInput}
                        multiline
                        numberOfLines={3}
                        value={refusRaison}
                        onChangeText={setRefusRaison}
                        placeholder="Entrez la raison du refus..."
                    />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonCancel]}
                            onPress={() => setRefusModalVisible(false)}
                        >
                            <Text style={styles.modalButtonTextCancel}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonConfirm]}
                            onPress={confirmRefus}
                        >
                            <Text style={styles.modalButtonTextConfirm}>Refuser</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}
            <ScrollView
                style={styles.mainScroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'recettes' && renderRecettesTab()}
                {activeTab === 'utilisateurs' && renderUtilisateursTab()}
                {activeTab === 'commentaires' && renderCommentairesTab()}
                {activeTab === 'modifications' && renderModificationsTab()}
                {activeTab === 'signalements' && renderSignalementsTab()}
            </ScrollView>
            {renderRefusModal()}
            <SideMenu visible={showMenu} onClose={() => setShowMenu(false)} navigation={navigation} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    // Mock Mod Styles
    modCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#eee',
    },
    modHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    modTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    modSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    modBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        borderWidth: 1,
    },
    badgeInfo: {
        borderColor: '#E3F2FD',
        backgroundColor: '#E3F2FD',
    },
    badgeError: {
        borderColor: '#FFEBEE',
        backgroundColor: '#FFEBEE',
    },
    textInfo: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1976D2',
    },
    textError: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#D32F2F',
    },
    changesBox: {
        backgroundColor: '#E3F2FD',
        padding: SPACING.md,
        borderRadius: 4,
        marginBottom: SPACING.md,
    },
    changesLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 5,
    },
    changeText: {
        fontSize: 12,
        color: '#0D47A1',
        fontWeight: '600',
    },
    modActions: {
        flexDirection: 'row',
        gap: 10,
    },
    // Header
    headerContainer: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerTop: {
        backgroundColor: COLORS.primary, // #7B5FB8
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerBtnSecondary: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerBtnPrimary: {
        backgroundColor: '#9B4DCA', // Darker purple highlight
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    headerBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    // Tabs
    tabsContainer: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    tabsScrollContent: {
        paddingHorizontal: SPACING.md,
    },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        marginRight: 10,
        position: 'relative',
    },
    tabItemActive: {
        // Active state managed by text color and underline
    },
    tabText: {
        marginLeft: 8,
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    tabTextActive: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: COLORS.primary,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    // Content
    mainScroll: {
        flex: 1,
    },
    contentSection: {
        padding: SPACING.lg,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: SPACING.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statLabel: {
        color: COLORS.textLight,
        fontSize: 13,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    emptyBox: {
        padding: SPACING.xl,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    emptyText: {
        color: COLORS.textMuted,
    },
    // Cards Lists
    listContainer: {
        gap: SPACING.md,
    },
    longCard: {
        borderRadius: 8,
        padding: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    longCardPending: {
        backgroundColor: '#FFF8E1', // Light yellow for pending
    },
    longCardApproved: {
        backgroundColor: '#E8F5E9', // Light green for approved
    },
    cardImage: {
        width: 60,
        height: 60,
        borderRadius: 6,
        backgroundColor: '#eee',
    },
    cardContent: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    cardSubtitle: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 5,
    },
    btnSuccess: {
        backgroundColor: '#00C851',
    },
    btnError: {
        backgroundColor: '#FF4444',
    },
    btnInfo: {
        backgroundColor: '#33b5e5',
    },
    btnWarning: {
        backgroundColor: '#FF8800',
    },
    actionBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    viewMoreBtn: {
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    viewMoreText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: SPACING.xl,
    },
    // Users
    userRow: {
        backgroundColor: 'white',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: 'black',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    userRowName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 2,
    },
    userRowEmail: {
        fontSize: 13,
        color: COLORS.textLight,
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    badgeAdmin: {
        backgroundColor: '#F3E5F5', // Lighter purple
    },
    badgeUser: {
        backgroundColor: '#E3F2FD', // Lighter blue
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4A148C', // Darker text for contrast
    },
    userRowActions: {
        flexDirection: 'column', // Stack buttons vertically for better touch targets
        gap: 8,
    },
    // Comments
    commentRow: {
        backgroundColor: 'white',
        padding: SPACING.md,
        borderRadius: 8,
        marginBottom: SPACING.sm,
        flexDirection: 'row',
        gap: SPACING.md,
        elevation: 1,
    },
    commentUser: {
        fontWeight: 'bold',
        fontSize: 14,
        color: COLORS.text,
    },
    commentTarget: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginVertical: 2,
    },
    commentDate: {
        fontSize: 10,
        color: '#999',
        marginBottom: 5,
    },
    commentContent: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: 16,
        textAlign: 'center',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#f0f0f0',
    },
    modalButtonConfirm: {
        backgroundColor: COLORS.error,
    },
    modalButtonTextCancel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    modalButtonTextConfirm: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

export default AdminDashboard;
