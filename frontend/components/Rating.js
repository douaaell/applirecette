import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../utils/constants';

const Rating = ({ value = 0, onChange, size = 24, readonly = false }) => {
    const stars = [1, 2, 3, 4, 5];

    return (
        <View style={styles.container}>
            {stars.map((star) => (
                <TouchableOpacity
                    key={star}
                    onPress={() => !readonly && onChange && onChange(star)}
                    disabled={readonly}
                    style={[styles.star, readonly && styles.readonly]}
                >
                    <Ionicons
                        name={star <= value ? 'star' : 'star-outline'}
                        size={size}
                        color={star <= value ? COLORS.accent : COLORS.textMuted}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    star: {
        marginRight: SPACING.xs,
    },
    readonly: {
        opacity: 1,
    },
});

export default Rating;
