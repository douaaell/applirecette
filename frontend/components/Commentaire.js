import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS } from '../utils/constants';

const Commentaire = ({
    commentaire,
    currentUserId,
    isAdmin,
    onEdit,
    onDelete
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editContent, setEditContent] = useState(commentaire.contenu);

    const canEdit = currentUserId === commentaire.utilisateur?._id;
    const canDelete = canEdit || isAdmin;

    const handleDelete = () => {
        Alert.alert(
            'Supprimer le commentaire',
            'Êtes-vous sûr de vouloir supprimer ce commentaire ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => onDelete(commentaire._id),
                },
            ]
        );
    };

    const handleSave = async () => {
        if (!editContent.trim()) {
            Alert.alert('Erreur', 'Le commentaire ne peut pas être vide');
            return;
        }

        try {
            setIsSaving(true);
            await onEdit(commentaire._id, editContent);
            setIsEditing(false);
        } catch (err) {
            Alert.alert('Erreur', 'Impossible de modifier le commentaire');
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return 'Date inconnue';
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'Date invalide';

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `${diffMins} min`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}j`;

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    const displayDate = formatDate(commentaire.date || commentaire.createdAt || commentaire.dateCreation);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {commentaire.utilisateur?.nom?.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>

                <View style={styles.headerInfo}>
                    <Text style={styles.userName}>
                        {commentaire.utilisateur?.nom || 'Utilisateur'} {commentaire.utilisateur?.prenom || ''}
                    </Text>
                    <Text style={styles.dateText}>{displayDate}</Text>
                </View>

                {/* Actions icons (Upper Right) */}
                <View style={styles.actions}>
                    {canEdit && !isEditing && (
                        <TouchableOpacity onPress={() => { setIsEditing(true); setEditContent(commentaire.contenu); }} style={styles.actionIconButton}>
                            <Ionicons name="create-outline" size={20} color="#7E57C2" />
                        </TouchableOpacity>
                    )}
                    {canDelete && (
                        <TouchableOpacity onPress={handleDelete} style={styles.actionIconButton}>
                            <Ionicons name="trash-outline" size={20} color="#E53935" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Note Stars */}
            {commentaire.note && !isEditing && (
                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                            key={star}
                            name={star <= commentaire.note ? "star" : "star-outline"}
                            size={14}
                            color="#FFD700"
                        />
                    ))}
                </View>
            )}

            {/* Content or Edit Mode */}
            {isEditing ? (
                <View style={styles.editCard}>
                    <TextInput
                        style={styles.editInput}
                        value={editContent}
                        onChangeText={setEditContent}
                        multiline
                        autoFocus
                        editable={!isSaving}
                    />
                    <View style={styles.editButtonsRow}>
                        <TouchableOpacity
                            onPress={() => { setIsEditing(false); setEditContent(commentaire.contenu); }}
                            style={styles.cancelLink}
                            disabled={isSaving}
                        >
                            <Text style={styles.cancelLinkText}>Annuler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSave}
                            style={[styles.saveButton, isSaving && { backgroundColor: '#FFA726' }]}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.saveButtonText}>Enregistrer</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <Text style={styles.commentContentText}>{commentaire.contenu}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#7E57C2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
    },
    dateText: {
        fontSize: 11,
        color: '#888',
        marginTop: 1,
    },
    actions: {
        flexDirection: 'row',
    },
    actionIconButton: {
        padding: 5,
        marginLeft: 5,
    },
    starsRow: {
        flexDirection: 'row',
        marginLeft: 48,
        marginBottom: 5,
    },
    commentContentText: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        marginLeft: 48,
    },
    editCard: {
        marginLeft: 48,
        marginTop: 8,
    },
    editInput: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#CED4DA',
        borderRadius: 8,
        padding: 12,
        minHeight: 70,
        textAlignVertical: 'top',
        fontSize: 14,
        color: '#333',
    },
    editButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 12,
    },
    cancelLink: {
        marginRight: 20,
    },
    cancelLinkText: {
        color: '#444',
        fontSize: 14,
    },
    saveButton: {
        backgroundColor: '#FB8C00',
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 10,
        minWidth: 100,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default Commentaire;
