import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS } from '../utils/constants';

const RecetteCard = ({ recette, onPress, onFavoritePress, isFavorite, showStatus }) => {
    const getStatutColor = (statut) => {
        switch (statut) {
            case 'APPROUVEE': return COLORS.success;
            case 'EN_ATTENTE': return COLORS.warning;
            case 'REFUSEE': return COLORS.error;
            default: return COLORS.textMuted;
        }
    };

    const getDifficultyColor = (difficulte) => {
        const diff = difficulte?.toLowerCase() || 'facile';
        switch (diff) {
            case 'facile':
                return { bg: '#E8F5E9', text: '#2E7D32' }; // Vert clair
            case 'moyen':
                return { bg: '#FFF3E0', text: '#EF6C00' }; // Orange/Jaune
            case 'difficile':
                return { bg: '#FFEBEE', text: '#C62828' }; // Rouge clair
            default:
                return { bg: '#E8F5E9', text: '#2E7D32' };
        }
    };

    const difficultyStyle = getDifficultyColor(recette.difficulte);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            {/* Image (Haut) */}
            <View style={styles.imageContainer}>
                {recette.image ? (
                    <Image
                        source={{ uri: recette.image }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.image, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0E0E0' }]}>
                        <Ionicons name="restaurant" size={40} color="#999" />
                    </View>
                )}

                {/* Badge Catégorie - En bas à gauche selon design */}
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{recette.categorie || 'Plat'}</Text>
                </View>

                {/* Bouton Favori */}
                {onFavoritePress && (
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            onFavoritePress();
                        }}
                    >
                        <Ionicons
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={20}
                            color={isFavorite ? COLORS.error : COLORS.textMuted}
                        />
                    </TouchableOpacity>
                )}

                {/* Badge Statut - En attente orange en haut à droite */}
                {recette.statut === 'EN_ATTENTE' && (
                    <View style={styles.enAttenteBadge}>
                        <Ionicons name="time-outline" size={12} color="#fff" />
                        <Text style={styles.enAttenteText}>En attente</Text>
                    </View>
                )}
                {/* Badge Statut pour Admin */}
                {showStatus && recette.statut && recette.statut !== 'EN_ATTENTE' && (
                    <View style={[styles.statutBadge, { backgroundColor: getStatutColor(recette.statut) }]}>
                        <Text style={styles.statutText}>{recette.statut}</Text>
                    </View>
                )}
            </View>

            {/* Contenu (Bas) */}
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>
                    {recette.titre}
                </Text>

                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
                        <Text style={styles.infoText}>{recette.tempsPreparation} min</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="star" size={14} color={COLORS.warning} />
                        <Text style={styles.infoText}>{recette.noteMoyenne?.toFixed(1) || '0.0'}</Text>
                    </View>
                </View>

                <View style={styles.footerRow}>
                    <View style={[styles.badge, { backgroundColor: difficultyStyle.bg }]}>
                        <Text style={[styles.badgeText, { color: difficultyStyle.text }]}>
                            {recette.difficulte || 'Facile'}
                        </Text>
                    </View>
                    <View style={styles.authorContainer}>
                        <Ionicons name="restaurant" size={12} color={COLORS.textMuted} />
                        <Text style={styles.authorText} numberOfLines={1}>
                            {recette.auteur?.nom || recette.auteur?.prenom || 'Inconnu'}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: SIZES.borderRadius,
        marginBottom: SPACING.md, // Reduced margin for Grid
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: 120, // Compact height for Grid
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    categoryBadge: {
        position: 'absolute',
        left: SPACING.xs,
        bottom: SPACING.xs,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    favoriteButton: {
        position: 'absolute',
        top: SPACING.xs,
        right: SPACING.xs,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 15,
        padding: 5,
        elevation: 2,
    },
    statutBadge: {
        position: 'absolute',
        top: SPACING.xs,
        left: SPACING.xs,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statutText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    enAttenteBadge: {
        position: 'absolute',
        top: SPACING.xs,
        right: SPACING.xs,
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    enAttenteText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '600',
    },
    content: {
        padding: 8, // Compact padding
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 6,
        alignItems: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    infoText: {
        marginLeft: 4,
        color: COLORS.textLight,
        fontSize: 11,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
        marginLeft: 8,
    },
    authorText: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginLeft: 4,
    },
});

export default RecetteCard;
