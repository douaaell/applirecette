import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, SIZES } from '../utils/constants';
import { notificationAPI } from '../utils/api';
import { useNavigation } from '@react-navigation/native';

const Notifications = () => {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('TOUTES'); // TOUTES, NON_LUES, LUES

    const fetchNotifications = async () => {
        try {
            const response = await notificationAPI.getMesNotifications();
            setNotifications(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationAPI.marquerCommeLue(id);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, lu: true } : n)
            );
        } catch (error) {
            console.error('Erreur marquage lue:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.toutMarquerCommeLues();
            setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
        } catch (error) {
            console.error('Erreur marquage toutes lues:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await notificationAPI.supprimer(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    };

    const getFilteredNotifications = () => {
        switch (filter) {
            case 'NON_LUES':
                return notifications.filter(n => !n.lu);
            case 'LUES':
                return notifications.filter(n => n.lu);
            default:
                return notifications;
        }
    };

    const renderNotificationItem = ({ item }) => {
        const isRead = item.lu;

        const getIcon = () => {
            switch (item.type) {
                case 'NOUVEAU_COMMENTAIRE':
                    return { name: 'chatbubble-outline', color: '#B8A5D9' };
                case 'RECETTE_APPROUVEE':
                    return { name: 'checkmark-circle-outline', color: '#4CAF50' };
                case 'RECETTE_REFUSEE':
                    return { name: 'close-circle-outline', color: COLORS.error };
                case 'MODIFICATION_APPROUVEE':
                    return { name: 'checkmark-circle-outline', color: '#4CAF50' };
                case 'MODIFICATION_REFUSEE':
                    return { name: 'close-circle-outline', color: COLORS.error };
                default:
                    return { name: 'notifications-outline', color: COLORS.secondary };
            }
        };

        const icon = getIcon();

        return (
            <View style={[styles.notificationCard, !isRead && styles.unreadCard]}>
                {!isRead && <View style={styles.unreadBorder} />}
                <View style={styles.notificationHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={icon.name} size={20} color={icon.color} />
                        <Text style={styles.notificationType}>{item.titre}</Text>
                    </View>
                    <Text style={styles.dateText}>
                        {new Date(item.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </Text>
                </View>

                <Text style={styles.messageText}>{item.message}</Text>

                <View style={styles.footerRow}>
                    {item.recetteId && (
                        <TouchableOpacity
                            style={styles.recetteLink}
                            onPress={() => navigation.navigate('DetailRecette', { recetteId: item.recetteId._id })}
                        >
                            <Ionicons name="book-outline" size={14} color={COLORS.secondary} />
                            <Text style={styles.recetteLinkText}>{item.recetteId.titre}</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.actionButtons}>
                        {!isRead && (
                            <TouchableOpacity onPress={() => handleMarkAsRead(item._id)} style={styles.actionButton}>
                                <Ionicons name="checkmark-done" size={20} color="#4CAF50" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionButton}>
                            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const filteredData = getFilteredNotifications();
    const unreadCount = notifications.filter(n => !n.lu).length;
    const readCount = notifications.filter(n => n.lu).length;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Accueil')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    <Text style={styles.backText}>Retour</Text>
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <Text style={styles.unreadHeaderCount}>{unreadCount} non lues</Text>
                    <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
                        <Ionicons name="checkmark-done" size={18} color="#fff" />
                        <Text style={styles.markAllText}>Tout marquer comme lu</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Ionicons name="notifications-outline" size={28} color={COLORS.secondary} />
                    <Text style={styles.title}>Notifications</Text>
                </View>

                {/* Filter Chips */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={[styles.filterChip, filter === 'TOUTES' && styles.activeFilterChip]}
                        onPress={() => setFilter('TOUTES')}
                    >
                        <Text style={[styles.filterChipText, filter === 'TOUTES' && styles.activeFilterChipText]}>
                            Toutes ({notifications.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, filter === 'NON_LUES' && styles.activeFilterChip]}
                        onPress={() => setFilter('NON_LUES')}
                    >
                        <Text style={[styles.filterChipText, filter === 'NON_LUES' && styles.activeFilterChipText]}>
                            Non lues ({unreadCount})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, filter === 'LUES' && styles.activeFilterChip]}
                        onPress={() => setFilter('LUES')}
                    >
                        <Text style={[styles.filterChipText, filter === 'LUES' && styles.activeFilterChipText]}>
                            Lues ({readCount})
                        </Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={filteredData}
                        renderItem={renderNotificationItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="notifications-off-outline" size={64} color={COLORS.textMuted} />
                                <Text style={styles.emptyText}>Aucune notification</Text>
                            </View>
                        }
                    />
                )}

                {/* Bottom Stats */}
                {!loading && (
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Total de notifications</Text>
                            <Text style={styles.statValue}>{notifications.length}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Non lues</Text>
                            <Text style={[styles.statValue, { color: COLORS.secondary }]}>{unreadCount}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Lues</Text>
                            <Text style={[styles.statValue, { color: '#4CAF50' }]}>{readCount}</Text>
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        marginLeft: 5,
        fontSize: FONTS.sizes.md,
        color: COLORS.text,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unreadHeaderCount: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textMuted,
        marginRight: 10,
    },
    markAllButton: {
        backgroundColor: COLORS.secondary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    markAllText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    content: {
        flex: 1,
        padding: SPACING.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: FONTS.sizes.xl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginLeft: 10,
    },
    filterContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.lg,
    },
    filterChip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 10,
    },
    activeFilterChip: {
        backgroundColor: COLORS.secondary,
    },
    filterChipText: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: '500',
    },
    activeFilterChipText: {
        color: '#fff',
    },
    listContainer: {
        paddingBottom: 20,
    },
    notificationCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        position: 'relative',
        overflow: 'hidden',
    },
    unreadCard: {
        borderColor: COLORS.secondaryLight,
        backgroundColor: '#FFF9F5',
    },
    unreadBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 4,
        backgroundColor: COLORS.secondary,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationType: {
        fontSize: FONTS.sizes.md,
        fontWeight: 'bold',
        color: COLORS.text,
        marginLeft: 8,
    },
    dateText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    messageText: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textLight,
        marginBottom: 12,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    recetteLink: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F7FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    recetteLinkText: {
        fontSize: 12,
        color: COLORS.secondary,
        fontWeight: '500',
        marginLeft: 5,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    actionButton: {
        marginLeft: 15,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        marginTop: 10,
    },
    statItem: {
        alignItems: 'flex-start',
    },
    statLabel: {
        fontSize: 10,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 20,
        fontSize: FONTS.sizes.md,
        color: COLORS.textMuted,
    },
});

export default Notifications;
