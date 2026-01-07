import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../redux/slices/authSlice';
import { COLORS, SPACING, SIZES, FONTS, MESSAGES } from '../utils/constants';

const Login = ({ navigation }) => {
    const dispatch = useDispatch();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {


        if (!email.trim() || !password.trim()) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        try {
            setLoading(true);
            const result = await dispatch(login({ email, password })).unwrap();
            Alert.alert('Succès', MESSAGES.CONNEXION_REUSSIE);
            
            // Redirection selon le rôle de l'utilisateur
            setTimeout(() => {
                if (result?.role === 'ADMIN') {
                    navigation.replace('AdminDashboard');
                } else {
                    navigation.replace('Accueil');
                }
            }, 1000);
        } catch (error) {
            console.error('❌ Erreur dans handleLogin:', error);
            let errorMessage = 'Email ou mot de passe incorrect';
            
            if (typeof error === 'string') {
                errorMessage = error;
            } else if (error?.message) {
                errorMessage = error.message;
            } else if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            Alert.alert('Erreur de connexion', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Card Container */}
                <View style={styles.card}>
                    {/* Close Button */}
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <Ionicons name="close" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logo}>
                            <Ionicons name="restaurant" size={48} color="#fff" />
                        </View>
                        <Text style={styles.title}>Connexion</Text>
                        <Text style={styles.subtitle}>Accédez à votre compte</Text>
                    </View>

                    {/* Formulaire */}
                    <View style={styles.form}>
                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="votre@email.com"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                />
                            </View>
                        </View>

                        {/* Mot de passe */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mot de passe</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoComplete="password"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color={COLORS.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Bouton Connexion */}
                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <Ionicons name="sparkles" size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.loginButtonText}>
                                {loading ? 'Connexion...' : 'Se connecter'}
                            </Text>
                        </TouchableOpacity>

                        {/* Lien Inscription */}
                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>Vous n'avez pas de compte ? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Inscription')}>
                                <Text style={styles.signupLink}>Inscrivez-vous</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 400,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: COLORS.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.secondary,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textMuted,
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    inputLabel: {
        fontSize: FONTS.sizes.md,
        color: COLORS.text,
        marginBottom: SPACING.xs,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        paddingHorizontal: SPACING.md,
        height: 50,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    inputIcon: {
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        fontSize: FONTS.sizes.md,
        color: COLORS.text,
    },
    eyeButton: {
        padding: SPACING.xs,
    },
    loginButton: {
        backgroundColor: COLORS.secondary,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.lg,
        flexDirection: 'row',
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: FONTS.sizes.lg,
        fontWeight: 'bold',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.lg,
    },
    signupText: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textMuted,
    },
    signupLink: {
        fontSize: FONTS.sizes.md,
        color: COLORS.secondary,
        fontWeight: '600',
    },
});

export default Login;
