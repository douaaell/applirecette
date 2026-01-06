// ════════════════════════════════════════
// 🎨 COULEURS
// ════════════════════════════════════════

export const COLORS = {
    // Couleurs principales - Violet/Pourpre (selon maquette)
    primary: '#7B5FB8',        // Violet principal
    primaryDark: '#6247AA',    // Violet foncé
    primaryLight: '#9D84C8',   // Violet clair

    // Orange pour visiteurs et accents
    secondary: '#FF8C42',      // Orange pour l'interface visiteur
    secondaryDark: '#FF6B1A',  // Orange foncé
    secondaryLight: '#FFAD70', // Orange clair

    accent: '#FFE66D',
    accentDark: '#F5DC5D',

    // Arrière-plans
    background: '#F7F9FC',
    backgroundDark: '#1A1A2E',
    card: '#FFFFFF',
    cardDark: '#252A48',

    // Textes
    text: '#2D3436',
    textLight: '#636E72',
    textDark: '#FFFFFF',
    textMuted: '#95A5A6',

    // États
    success: '#00B894',
    error: '#D63031',
    warning: '#FDCB6E',
    info: '#74B9FF',

    // Autres
    border: '#DFE6E9',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Dégradés
    gradientStart: '#7B5FB8',
    gradientEnd: '#FF8C42',
};

// ════════════════════════════════════════
// 📏 ESPACEMENTS
// ════════════════════════════════════════

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// ════════════════════════════════════════
// 🔤 TYPOGRAPHIE
// ════════════════════════════════════════

export const FONTS = {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    sizes: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 24,
        xxl: 32,
    },
};

// ════════════════════════════════════════
// 📱 TAILLES
// ════════════════════════════════════════

export const SIZES = {
    borderRadius: 12,
    borderRadiusSmall: 8,
    borderRadiusLarge: 16,
    iconSmall: 20,
    iconMedium: 24,
    iconLarge: 32,
    buttonHeight: 50,
    inputHeight: 50,
    headerHeight: 60,
};

// ════════════════════════════════════════
// 🎭 RÔLES UTILISATEURS
// ════════════════════════════════════════

export const ROLES = {
    USER: 'USER',
    ADMIN: 'ADMIN',
};

// ════════════════════════════════════════
// 📊 STATUTS RECETTES
// ════════════════════════════════════════

export const STATUT_RECETTE = {
    EN_ATTENTE: 'EN_ATTENTE',
    APPROUVEE: 'APPROUVEE',
    REFUSEE: 'REFUSEE',
};

// ════════════════════════════════════════
// 🍳 CATÉGORIES RECETTES
// ════════════════════════════════════════

export const CATEGORIES = [
    { label: 'Toutes', value: '' },
    { label: 'Entrées', value: 'entrees' },
    { label: 'Plats principaux', value: 'plats' },
    { label: 'Desserts', value: 'desserts' },
    { label: 'Salades', value: 'salades' },
    { label: 'Soupes', value: 'soupes' },
    { label: 'Boissons', value: 'boissons' },
    { label: 'Petit-déjeuner', value: 'petit-dejeuner' },
    { label: 'Végétarien', value: 'vegetarien' },
    { label: 'Vegan', value: 'vegan' },
];

// ════════════════════════════════════════
// ⏱️ TEMPS DE PRÉPARATION
// ════════════════════════════════════════

export const TEMPS_PREPARATION = [
    { label: 'Tous', value: '' },
    { label: 'Moins de 15 min', value: '0-15' },
    { label: '15-30 min', value: '15-30' },
    { label: '30-60 min', value: '30-60' },
    { label: 'Plus d\'1 heure', value: '60+' },
];

// ════════════════════════════════════════
// 📈 NIVEAUX DE DIFFICULTÉ
// ════════════════════════════════════════

export const DIFFICULTES = [
    { label: 'Toutes', value: '' },
    { label: 'Facile', value: 'facile', icon: '😊' },
    { label: 'Moyen', value: 'moyen', icon: '🤔' },
    { label: 'Difficile', value: 'difficile', icon: '😰' },
];

// ════════════════════════════════════════
// 🔢 OPTIONS DE TRI
// ════════════════════════════════════════

export const TRIS = [
    { label: 'Plus récentes', value: 'recent' },
    { label: 'Plus populaires', value: 'populaire' },
    { label: 'Meilleures notes', value: 'note' },
    { label: 'Temps (croissant)', value: 'temps-asc' },
    { label: 'Temps (décroissant)', value: 'temps-desc' },
];

// ════════════════════════════════════════
// 💬 MESSAGES
// ════════════════════════════════════════

export const MESSAGES = {
    LOGIN_REQUIRED: 'Vous devez être connecté pour effectuer cette action',
    RECETTE_AJOUTEE: 'Recette ajoutée ! Elle sera visible après validation.',
    COMMENTAIRE_AJOUTE: 'Commentaire ajouté avec succès',
    FAVORI_AJOUTE: 'Ajouté aux favoris',
    FAVORI_RETIRE: 'Retiré des favoris',
    ERREUR_GENERALE: 'Une erreur est survenue. Veuillez réessayer.',
    CONNEXION_REUSSIE: 'Connexion réussie !',
    INSCRIPTION_REUSSIE: 'Inscription réussie ! Veuillez vous connecter.',
    DECONNEXION_REUSSIE: 'Déconnexion réussie',
};

// ════════════════════════════════════════
// 🔒 ROUTES PROTÉGÉES
// ════════════════════════════════════════

export const PROTECTED_ROUTES = {
    USER: ['AjouterRecette', 'Favoris', 'Profil'],
    ADMIN: ['AdminDashboard'],
};
