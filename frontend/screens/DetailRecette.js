import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { recetteAPI, commentaireAPI, utilisateurAPI, demandeModificationAPI, signalementAPI } from '../utils/api';
import { fetchRecettes } from '../redux/slices/recetteSlice';
import { toggleFavori, refreshProfile } from '../redux/slices/authSlice';

import Commentaire from '../components/Commentaire';
import Rating from '../components/Rating';
import SideMenu from '../components/SideMenu';
import { COLORS, SPACING, SIZES, FONTS, MESSAGES } from '../utils/constants';

const DetailRecette = ({ route, navigation }) => {
    const { recetteId } = route.params || {};

    // Protection contre ID manquant
    useEffect(() => {
        if (!recetteId || recetteId === 'undefined') {
            console.error('❌ DetailRecette: recetteId manquant ou invalide:', recetteId);
            Alert.alert('Erreur', 'Recette introuvable');
            navigation.navigate('Accueil');
        }
    }, [recetteId, navigation]);
    const commentInputRef = useRef(null);
    const dispatch = useDispatch();
    const { isAuthenticated, user, role } = useSelector((state) => state.auth);

    const [recette, setRecette] = useState(null);
    const [commentaires, setCommentaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);

    // Commentaire
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [commentRating, setCommentRating] = useState(5);
    const [editingComment, setEditingComment] = useState(null);
    const [replyTo, setReplyTo] = useState(null);

    // Portions ajustables
    const [portions, setPortions] = useState(1);

    // Onglets (Ingrédients / Préparation)
    const [activeTab, setActiveTab] = useState('ingredients');


    const isAdmin = role === 'ADMIN';
    const isOwner = isAuthenticated && recette?.auteur?._id === user?._id;

    // Favoris logic derived from Redux state
    const isFavorite = user?.favoris?.some(f => (f._id === recetteId) || (f === recetteId)) || false;

    useEffect(() => {
        if (recetteId && recetteId !== 'undefined') {
            loadRecette();
            loadCommentaires();
        }
    }, [recetteId]);

    const loadRecette = async () => {
        if (!recetteId || recetteId === 'undefined') return;
        try {
            setLoading(true);
            const response = await recetteAPI.getById(recetteId);
            setRecette(response.data);
            setPortions(response.data.portions || 1);
        } catch (error) {
            console.error('Erreur chargement recette:', error);
            Alert.alert('Erreur', 'Impossible de charger la recette');
            navigation.navigate('Accueil');
        } finally {
            setLoading(false);
        }
    };

    const loadCommentaires = async () => {
        try {
            const response = await commentaireAPI.getByRecette(recetteId);
            setCommentaires(response.data);
        } catch (error) {
            console.error('Erreur chargement commentaires:', error);
        }
    };

    const handleFavorite = async () => {
        if (!isAuthenticated) {
            // Navigate to Login if not authenticated (assuming Login screen exists in stack)
            // If strictly using 'Login' component name
            Alert.alert('Info', 'Veuillez vous connecter pour ajouter aux favoris');
            return;
        }
        dispatch(toggleFavori(recetteId));
    };

    const handleAddComment = async () => {





        if (!isAuthenticated) {
            Alert.alert('Info', 'Connectez-vous pour laisser un avis');
            return;
        }

        if (!commentText.trim()) {
            Alert.alert('Erreur', 'Le commentaire ne peut pas être vide');
            return;
        }

        try {
            const commentData = {
                recette: recetteId,
                contenu: commentText,
                note: 5,
                parentCommentaire: replyTo ? replyTo._id : undefined
            };



            if (editingComment) {
                await commentaireAPI.updateCommentaire(editingComment._id, commentData);
                Alert.alert('Succès', 'Commentaire modifié');
            } else {

                await commentaireAPI.addCommentaire(commentData);
                Alert.alert('Succès', 'Votre avis a été publié');
            }

            setCommentText('');
            setEditingComment(null);
            setReplyTo(null);
            loadCommentaires();
            loadRecette();
        } catch (error) {
            console.error('❌ Erreur ajout commentaire:', error);
            Alert.alert('Erreur', error.response?.data?.message || MESSAGES.ERREUR_GENERALE);
        }
    };

    const handleEditComment = async (commentId, newContent) => {
        try {
            await commentaireAPI.updateCommentaire(commentId, { contenu: newContent });
            await loadCommentaires();
            // Pas besoin d'alerte, le composant Commentaire gère déjà le feedback
        } catch (error) {
            console.error('Erreur modification commentaire:', error);
            Alert.alert('Erreur', 'Impossible de modifier le commentaire');
            throw error;
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {


            // Mise à jour optimiste pour l'instantanéité
            setCommentaires(prev => prev.filter(c => c._id !== commentId));

            await commentaireAPI.deleteCommentaire(commentId);

            // Petit délai pour laisser le temps au serveur/DB de se mettre à jour
            setTimeout(async () => {
                await loadCommentaires();
                await loadRecette();
            }, 500);

            if (Platform.OS !== 'web') {
                Alert.alert('Succès', 'Commentaire supprimé');
            }
        } catch (error) {
            console.error('❌ Erreur suppression commentaire:', error);
            const errorMsg = error.response?.data?.message || error.message || MESSAGES.ERREUR_GENERALE;

            // Recharger pour restaurer en cas d'erreur
            await loadCommentaires();

            if (Platform.OS === 'web') alert('Erreur: ' + errorMsg);
            else Alert.alert('Erreur', errorMsg);
        }
    };


    const handleReportRecipe = () => {
        if (!isAuthenticated) {
            Alert.alert('Info', 'Connectez-vous pour signaler du contenu');
            return;
        }

        const sendReport = async (motif) => {
            try {
                await signalementAPI.creer({
                    type: 'RECETTE',
                    cibleId: recetteId,
                    motif
                });
                Alert.alert('Merci', 'Votre signalement a été envoyé aux administrateurs.');
            } catch (error) {
                Alert.alert('Erreur', 'Impossible d\'envoyer le signalement');
            }
        };

        if (Platform.OS === 'ios') {
            Alert.prompt(
                'Signaler la recette',
                'Pourquoi souhaitez-vous signaler cette recette ?',
                [{ text: 'Annuler', style: 'cancel' }, { text: 'Signaler', onPress: (m) => sendReport(m || 'Autre') }]
            );
        } else if (Platform.OS === 'web') {
            const motif = window.prompt('Pourquoi souhaitez-vous signaler cette recette ?');
            if (motif) sendReport(motif);
        } else {
            // Android fallback
            Alert.alert(
                'Signaler la recette',
                'Motif du signalement',
                [
                    { text: 'Spam', onPress: () => sendReport('Spam') },
                    { text: 'Inapproprié', onPress: () => sendReport('Inapproprié') },
                    { text: 'Autre', onPress: () => sendReport('Autre') },
                    { text: 'Annuler', style: 'cancel' }
                ]
            );
        }
    };

    const handleReportComment = async (commentId) => {
        if (!isAuthenticated) {
            Alert.alert('Info', 'Connectez-vous pour signaler du contenu');
            return;
        }

        const sendReport = async (motif) => {
            try {
                await signalementAPI.creer({
                    type: 'COMMENTAIRE',
                    cibleId: commentId,
                    motif
                });
                Alert.alert('Merci', 'Votre signalement a été envoyé.');
            } catch (error) {
                Alert.alert('Erreur', 'Echec de l\'envoi');
            }
        };

        if (Platform.OS === 'ios') {
            Alert.prompt(
                'Signaler le commentaire',
                'Motif du signalement :',
                [{ text: 'Annuler', style: 'cancel' }, { text: 'Signaler', onPress: (m) => sendReport(m || 'Inapproprié') }]
            );
        } else if (Platform.OS === 'web') {
            const motif = window.prompt('Motif du signalement :');
            if (motif) sendReport(motif);
        } else {
            Alert.alert(
                'Signaler',
                'Motif du signalement',
                [
                    { text: 'Spam', onPress: () => sendReport('Spam') },
                    { text: 'Harcèlement', onPress: () => sendReport('Harcèlement') },
                    { text: 'Annuler', style: 'cancel' }
                ]
            );
        }
    };

    // --- ACTIONS ADMIN / OWNER ---

    const handleValidate = async () => {
        try {
            await recetteAPI.validerRecette(recetteId);
            Alert.alert('Succès', 'Recette validée avec succès');
            dispatch(fetchRecettes()); // Refresh list
            navigation.navigate('Accueil');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de valider la recette');
        }
    };

    const handleReject = async () => {
        Alert.prompt(
            'Refuser la recette',
            'Raison du refus',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Refuser',
                    style: 'destructive',
                    onPress: async (raison) => {
                        try {
                            await recetteAPI.refuserRecette(recetteId, raison || 'Non conforme');
                            Alert.alert('Succès', 'Recette refusée');
                            dispatch(fetchRecettes());
                            navigation.navigate('Accueil');
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de refuser');
                        }
                    }
                }
            ],
            'plain-text'
        );
    };

    const executeDelete = async () => {


        if (isAdmin) {
            // Admin delete directly
            try {

                const response = await recetteAPI.deleteRecette(recetteId);

                // Show success message compatible with platform
                if (Platform.OS === 'web') {
                    alert('Succès: Recette supprimée');
                } else {
                    Alert.alert('Succès', 'Recette supprimée');
                }

                dispatch(fetchRecettes());
                navigation.navigate('Accueil');
            } catch (e) {
                console.error('❌ Erreur suppression:', e);
                const errorMsg = e.response?.data?.message || e.message;
                if (Platform.OS === 'web') {
                    alert('Erreur: Echec de la suppression - ' + errorMsg);
                } else {
                    Alert.alert('Erreur', 'Echec de la suppression: ' + errorMsg);
                }
            }
        } else {
            // User request delete - Créer une demande
            try {
                await demandeModificationAPI.create({
                    type: 'suppression',
                    recetteId: recetteId,
                });

                const msg = 'Votre demande de suppression a été envoyée aux administrateurs.';
                if (Platform.OS === 'web') {
                    alert('Succès: ' + msg);
                } else {
                    Alert.alert('Succès', msg);
                }

                navigation.navigate('Accueil');
            } catch (e) {
                console.error('Erreur création demande suppression:', e);
                const errorMsg = 'Impossible d\'envoyer la demande de suppression';
                if (Platform.OS === 'web') {
                    alert('Erreur: ' + errorMsg);
                } else {
                    Alert.alert('Erreur', errorMsg);
                }
            }
        }
    };

    const handleDeleteRecette = async () => {
        const message = isAdmin
            ? 'Cette action est irréversible. Êtes-vous sûr de vouloir supprimer cette recette ?'
            : 'Une demande de suppression sera envoyée à l\'administrateur. Continuer ?';

        if (Platform.OS === 'web') {
            if (window.confirm(message)) {
                await executeDelete();
            }
        } else {
            Alert.alert(
                'Supprimer la recette',
                message,
                [
                    { text: 'Annuler', style: 'cancel' },
                    {
                        text: 'Confirmer',
                        style: 'destructive',
                        onPress: executeDelete
                    }
                ]
            );
        }
    };

    const handleEditRecette = () => {
        if (isAdmin) {
            // Admin edits directly
            navigation.navigate('AjouterRecette', { recette });
        } else {
            // User request edit
            Alert.alert('Info', 'La modification passera par une validation administrateur. Voulez-vous continuer ?', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Continuer', onPress: () => navigation.navigate('AjouterRecette', { recette }) }
            ]);
        }
    };


    // Ajuster les quantités
    const adjustQuantity = (quantity) => {
        if (!recette || !quantity) return quantity;
        const ratio = portions / (recette.portions || 1);
        const val = parseFloat(quantity);
        if (isNaN(val)) return quantity;

        const newVal = val * ratio;
        // Format logic: if integer, show integer, else 1 decimal
        return Number.isInteger(newVal) ? newVal : newVal.toFixed(1);
    };

    if (loading || !recette) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Image Header */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: recette.image || 'https://placehold.co/600x400/png?text=Recette' }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <View style={styles.imageOverlay} />

                    <View style={styles.headerButtons}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Accueil')}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(true)}>
                            <Ionicons name="menu" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Badge Enregistrer la recette - Jaune en haut à droite */}
                    {isAuthenticated && (
                        <TouchableOpacity
                            style={styles.saveRecipeBadge}
                            onPress={handleFavorite}
                        >
                            <Text style={styles.saveRecipeText}>Enregistrer la recette</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.headerInfo}>
                        {/* Title & Favorite Row */}
                        <View style={styles.titleRow}>
                            <Text style={styles.title}>{recette.titre}</Text>
                            <TouchableOpacity style={styles.favBtnCircle} onPress={handleFavorite}>
                                <Ionicons
                                    name={isFavorite ? 'heart' : 'heart-outline'}
                                    size={24}
                                    color={isFavorite ? COLORS.error : '#999'}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Author */}
                        <View style={styles.authorRowNew}>
                            <Text style={styles.authorText}>Par {recette.auteur ? `${recette.auteur.prenom || ''} ${recette.auteur.nom || ''}`.trim() : 'Chef Inconnu'}</Text>
                        </View>

                        {/* Meta Data Row: Time, People, Rating, Badges */}
                        <View style={styles.metaRowNew}>
                            <View style={styles.metaItemNew}>
                                <Ionicons name="time-outline" size={16} color={COLORS.textLight} />
                                <Text style={styles.metaTextNew}>{recette.tempsPreparation} min</Text>
                            </View>
                            <View style={styles.metaItemNew}>
                                <Ionicons name="people-outline" size={16} color={COLORS.textLight} />
                                <Text style={styles.metaTextNew}>{portions} personnes</Text>
                            </View>
                            <View style={styles.metaItemNew}>
                                <Ionicons name="star" size={16} color={COLORS.warning} />
                                <Text style={styles.metaTextNew}>{recette.noteGlobale?.toFixed(1) || 'N/A'}/5</Text>
                            </View>

                            {/* Badges */}
                            <View style={[styles.badgeNew, {
                                backgroundColor: recette.difficulte?.toLowerCase() === 'facile' ? '#E8F5E9' :
                                    recette.difficulte?.toLowerCase() === 'moyen' ? '#FFF3E0' : '#FFEBEE',
                                marginLeft: 8
                            }]}>
                                <Text style={[styles.badgeTextNew, {
                                    color: recette.difficulte?.toLowerCase() === 'facile' ? '#2E7D32' :
                                        recette.difficulte?.toLowerCase() === 'moyen' ? '#EF6C00' : '#C62828'
                                }]}>{recette.difficulte || 'Facile'}</Text>
                            </View>
                            <View style={[styles.badgeNew, { backgroundColor: '#FFF3E0', marginLeft: 8 }]}>
                                <Text style={[styles.badgeTextNew, { color: '#EF6C00' }]}>{recette.categorie || 'Plat'}</Text>
                            </View>
                            <View style={[styles.metaItemNew, { marginLeft: 12 }]}>
                                <Ionicons name="eye-outline" size={16} color={COLORS.textLight} />
                                <Text style={styles.metaTextNew}>{recette.vues || 0} vues</Text>
                            </View>
                            <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={handleReportRecipe}>
                                <Ionicons name="flag-outline" size={20} color={COLORS.textLight} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Portions Adjuster - Gray Box */}
                    <View style={styles.portionSection}>
                        <Text style={styles.portionLabel}>Ajuster les portions :</Text>
                        <View style={styles.portionControls}>
                            <TouchableOpacity onPress={() => portions > 1 && setPortions(portions - 1)} style={styles.portionBtnBox}>
                                <Ionicons name="remove" size={20} color={COLORS.text} />
                            </TouchableOpacity>
                            <Text style={styles.portionValueBox}>{portions}</Text>
                            <TouchableOpacity onPress={() => setPortions(portions + 1)} style={styles.portionBtnBox}>
                                <Ionicons name="add" size={20} color={COLORS.text} />
                            </TouchableOpacity>
                            <Text style={styles.portionUnitText}>personnes</Text>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeTab === 'ingredients' && styles.tabBtnActive]}
                            onPress={() => setActiveTab('ingredients')}
                        >
                            <Text style={[styles.tabText, activeTab === 'ingredients' && styles.tabTextActive]}>Ingrédients</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeTab === 'preparation' && styles.tabBtnActive]}
                            onPress={() => setActiveTab('preparation')}
                        >
                            <Text style={[styles.tabText, activeTab === 'preparation' && styles.tabTextActive]}>Préparation</Text>
                        </TouchableOpacity>
                    </View>

                    {activeTab === 'ingredients' ? (
                        <View style={styles.tabContent}>
                            {/* NOUVEAU DESIGN INGREDIENTS LISTE BLANCHE */}
                            <View style={styles.ingredientsListCard}>
                                <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Ingrédients</Text>
                                {recette.ingredients?.map((ing, i) => (
                                    <View key={i} style={styles.ingredientRowSimple}>
                                        <View style={styles.bulletPoint} />
                                        <Text style={styles.ingredientTextSimple}>
                                            {adjustQuantity(ing.quantite)} {ing.unite} {ing.nom}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.tabContent}>
                            <View style={styles.ingredientsListCard}>
                                <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>Préparation</Text>
                                {(!recette.etapes || recette.etapes.length === 0) && (
                                    <Text style={styles.emptyComments}>Aucune étape de préparation disponible.</Text>
                                )}
                                {recette.etapes?.map((step, i) => {
                                    const stepText = typeof step === 'object' ? (step.description || step.texte || '') : step;
                                    return (
                                        <View key={i} style={styles.stepRow}>
                                            <View style={styles.stepBadge}>
                                                <Text style={styles.stepNumber}>{i + 1}</Text>
                                            </View>
                                            <Text style={styles.stepText}>{stepText}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                </View>

                {/* Commentaires Section */}
                <View style={styles.commentSectionContainer}>
                    <Text style={styles.sectionTitle}>Commentaires ({commentaires.length})</Text>

                    <View style={styles.commentCard}>
                        {/* Zone de saisie inline */}
                        {isAuthenticated ? (
                            <View style={{ marginBottom: 20 }}>
                                {replyTo && (
                                    <View style={styles.replyIndicatorHeader}>
                                        <Text style={styles.replyIndicatorText}>
                                            Réponse à {replyTo.utilisateur?.prenom || 'Utilisateur'}
                                        </Text>
                                        <TouchableOpacity onPress={() => { setReplyTo(null); setCommentText(''); }}>
                                            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                <TextInput
                                    ref={commentInputRef}
                                    style={styles.inlineInput}
                                    placeholder={replyTo ? "Écrivez votre réponse..." : "Partagez votre avis sur cette recette..."}
                                    placeholderTextColor="#999"
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    multiline
                                />
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                                    {(replyTo || editingComment) && (
                                        <TouchableOpacity
                                            style={[styles.inlineSubmitBtn, { backgroundColor: '#f0f0f0' }]}
                                            onPress={() => {
                                                setReplyTo(null);
                                                setEditingComment(null);
                                                setCommentText('');
                                            }}
                                        >
                                            <Text style={[styles.inlineSubmitBtnText, { color: COLORS.text }]}>Annuler</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity style={styles.inlineSubmitBtn} onPress={handleAddComment}>
                                        <Ionicons name="send" size={16} color="white" style={{ marginRight: 6 }} />
                                        <Text style={styles.inlineSubmitBtnText}>
                                            {editingComment ? 'Modifier' : replyTo ? 'Répondre' : 'Publier'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.loginPromptBox}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={styles.loginPromptText}>Connectez-vous pour laisser un commentaire</Text>
                            </TouchableOpacity>
                        )}

                        {commentaires.length === 0 ? (
                            <Text style={styles.emptyComments}>
                                {isAuthenticated ? 'Soyez le premier à donner votre avis !' : 'Aucun commentaire pour le moment'}
                            </Text>
                        ) : (
                            commentaires.map((c, index) => (
                                <View key={c._id} style={index !== commentaires.length - 1 ? styles.commentSeparator : {}}>
                                    <Commentaire
                                        commentaire={c}
                                        currentUserId={user?._id}
                                        isAdmin={isAdmin}
                                        onEdit={handleEditComment}
                                        onDelete={handleDeleteComment}
                                        onReport={handleReportComment}
                                        onReply={(comment) => {
                                            setReplyTo(comment);
                                            const name = comment.utilisateur?.prenom || 'Utilisateur';
                                            setCommentText(`@${name} `);
                                            // Focus the input
                                            setTimeout(() => commentInputRef.current?.focus(), 100);
                                        }}
                                    />
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* ACTION BAR (Fixed Bottom) - Pour propriétaire ou admin */}
            {(isAdmin || isOwner) && (
                <View style={styles.actionBar}>
                    {isAdmin && recette.statut === 'EN_ATTENTE' ? (
                        <>
                            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={handleReject}>
                                <Text style={styles.actionBtnText}>Rejeter</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={handleValidate}>
                                <Text style={styles.actionBtnText}>Valider</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDeleteRecette}>
                                <Ionicons name="trash-outline" size={20} color="white" style={{ marginRight: 5 }} />
                                <Text style={styles.actionBtnText}>Supprimer</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {(isOwner || isAdmin) && (
                                <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={handleEditRecette}>
                                    <Ionicons name="create-outline" size={20} color="white" style={{ marginRight: 5 }} />
                                    <Text style={styles.actionBtnText}>Modifier la recette</Text>
                                </TouchableOpacity>
                            )}
                            {(isOwner || isAdmin) && (
                                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDeleteRecette}>
                                    <Ionicons name="trash-outline" size={20} color="white" style={{ marginRight: 5 }} />
                                    <Text style={styles.actionBtnText}>Supprimer la recette</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            )}

            {/* Modal suppressed as we use inline input now */}

            {/* MENU LATÉRAL */}
            <SideMenu visible={showMenu} onClose={() => setShowMenu(false)} navigation={navigation} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        height: 280,
        width: '100%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    headerButtons: {
        position: 'absolute',
        top: SPACING.xl,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    menuButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    saveRecipeBadge: {
        position: 'absolute',
        top: SPACING.xl,
        right: SPACING.md,
        backgroundColor: '#FFC107',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveRecipeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    favoriteButton: {
        position: 'absolute',
        top: SPACING.xl,
        right: SPACING.md,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    content: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -30,
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.lg,
    },
    headerInfo: {
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: SPACING.lg,
    },
    metaText: {
        marginLeft: 4,
        color: COLORS.textLight,
        fontWeight: '500',
    },
    authorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    // --- New Header Styles ---
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    favBtnCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F6F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    authorText: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    authorRowNew: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    metaRowNew: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    metaItemNew: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    metaTextNew: {
        marginLeft: 4,
        color: COLORS.text, // Darker than before
        fontSize: 13,
        fontWeight: '500',
    },
    badgeNew: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeTextNew: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },

    // --- Portion Box Styles ---
    portionSection: {
        backgroundColor: '#F9FAFB', // Light gray bg
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    portionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    portionControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    portionBtnBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    portionValueBox: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginHorizontal: 16,
        minWidth: 20,
        textAlign: 'center',
    },
    portionUnitText: {
        fontSize: 14,
        color: COLORS.text,
        marginLeft: 8,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
        backgroundColor: '#e0e0e0',
        borderRadius: 12,
        padding: 4,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabBtnActive: {
        backgroundColor: 'white',
        elevation: 2,
    },
    tabText: {
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    tabTextActive: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    tabContent: {
        marginBottom: SPACING.xl,
    },

    // Nouveaux Styles Ingredients
    ingredientsListCard: {
        backgroundColor: 'white',
        borderRadius: SIZES.borderRadius,
        padding: 16,
        paddingVertical: 20, // More vertical breathing room inside card
        elevation: 1,
    },
    ingredientRowSimple: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6, // Tighter spacing between items
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.secondary,
        marginRight: 12,
        marginTop: 7, // Adjusted for new line height
    },
    ingredientTextSimple: {
        fontSize: 15, // Slightly smaller text
        color: COLORS.text,
        flex: 1,
        lineHeight: 20, // Tighter line height
    },

    stepRow: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    stepBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FF6F00', // Deep Orange
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 0,
    },
    stepNumber: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    stepText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
        color: COLORS.text,
    },
    emptyComments: {
        fontStyle: 'italic',
        color: COLORS.textMuted,
        textAlign: 'center',
        marginVertical: 10,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        flexDirection: 'row',
        padding: 16,
        elevation: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    approveBtn: {
        backgroundColor: COLORS.success,
    },
    rejectBtn: {
        backgroundColor: COLORS.error,
    },
    editBtn: {
        backgroundColor: COLORS.secondary,
    },
    deleteBtn: {
        backgroundColor: COLORS.textMuted,
    },
    actionBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    commentInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    submitBtn: {
        fontSize: 14,
        marginBottom: 10,
    },
    // Styles Commentaires Redesign
    commentSectionContainer: {
        marginBottom: 80, // Space for bottom action bar
    },
    commentCard: {
        backgroundColor: 'white',
        borderRadius: SIZES.borderRadius,
        padding: SPACING.md,
        elevation: 1, // Shadow for Android
        shadowColor: "#000", // Shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    inlineInput: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 6,
        padding: 12,
        height: 80,
        textAlignVertical: 'top',
        fontSize: 14,
        marginBottom: 10,
        color: COLORS.text,
    },
    inlineSubmitBtn: {
        backgroundColor: COLORS.secondary, // Orange
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center',
    },
    inlineSubmitBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    commentSeparator: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 16,
        marginBottom: 16,
    },
    loginPromptBox: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginPromptText: {
        color: COLORS.textMuted,
        fontSize: 14,
    },
    replyIndicatorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 8,
    },
    replyIndicatorText: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: 'bold',
    },
});

export default DetailRecette;

