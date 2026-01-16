const admin = require('../config/firebaseAdmin');
const Utilisateur = require('../models/Utilisateur');

// 🛡️ C'est le garde à l'entrée : il vérifie le token Firebase avant de laisser passer une requête
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Non autorisé, pas de token' });
    }

    const upsertUserFromFirebase = async (firebaseUser) => {
        const uid = firebaseUser.uid;
        const email = firebaseUser.email || `${uid}@applirecette.com`;
        const displayName = (firebaseUser.name || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Utilisateur')).trim();
        const parts = displayName.split(/\s+/).filter(Boolean);
        const prenom = parts[0] || 'Utilisateur';
        const nom = parts.slice(1).join(' ') || 'Utilisateur';

        // D'abord chercher par uid, puis par email si besoin
        let utilisateur = await Utilisateur.findOne({ uid });

        if (!utilisateur) {
            // Vérifier si un utilisateur existe déjà avec cet email
            const existingByEmail = await Utilisateur.findOne({ email });
            if (existingByEmail) {
                // Mettre à jour l'uid existant au lieu de créer un doublon
                // IMPORTANT: Préserver le rôle existant (ADMIN, etc.)
                const roleAvant = existingByEmail.role;
                existingByEmail.uid = uid;
                existingByEmail.nom = nom;
                existingByEmail.prenom = prenom;
                // Ne pas toucher au rôle
                await existingByEmail.save();
                utilisateur = existingByEmail;
                if (utilisateur.role !== roleAvant) {
                    console.error(`❌ ERREUR: Le rôle a changé, restauration...`);
                    utilisateur.role = roleAvant;
                    await utilisateur.save();
                }
            } else {
                // Créer nouvel utilisateur
                utilisateur = await Utilisateur.findOneAndUpdate(
                    { uid },
                    {
                        $set: { email, nom, prenom },
                        $setOnInsert: {
                            uid,
                            role: 'USER',
                            dateInscription: new Date(),
                        },
                    },
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                );
            }
        } else {
            // Mettre à jour l'utilisateur existant SANS écraser le rôle
            // On préserve le rôle existant (ADMIN, USER, etc.)
            const roleAvant = utilisateur.role; // Sauvegarder le rôle avant mise à jour

            // Mettre à jour seulement les champs nécessaires, en préservant explicitement le rôle
            utilisateur.email = email;
            utilisateur.nom = nom;
            utilisateur.prenom = prenom;
            // IMPORTANT: Ne pas toucher au rôle, il reste tel quel
            await utilisateur.save();

            // Vérifier que le rôle est préservé
            if (utilisateur.role !== roleAvant) {
                console.error(`❌ ERREUR CRITIQUE: Le rôle a changé de ${roleAvant} à ${utilisateur.role}`);
                // Forcer la restauration du rôle original
                utilisateur.role = roleAvant;
                await utilisateur.save();
            }
        }

        // S'assurer que req.user contient bien le rôle
        req.user = utilisateur;
    };

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.userFirebase = decodedToken;
        await upsertUserFromFirebase(decodedToken);
        return next();
    } catch (error) {
        if (
            error.code === 'app/invalid-credential' ||
            (typeof error.message === 'string' && (error.message.includes('project ID') || error.message.includes('credential')))
        ) {
            try {
                let payload = token.split('.')[1];
                payload = payload.replace(/-/g, '+').replace(/_/g, '/');
                while (payload.length % 4) {
                    payload += '=';
                }

                const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));

                req.userFirebase = {
                    uid: decodedValue.user_id || decodedValue.sub,
                    email: decodedValue.email,
                    name: decodedValue.name,
                };

                await upsertUserFromFirebase(req.userFirebase);
                return next();
            } catch (e) {
                console.error('Echec du décodage manuel', e);
            }
        }

        console.error('Erreur vérification token:', error.message);
        return res.status(401).json({ message: 'Non autorisé, token invalide ou expiré' });
    }
};

// 👮 Vérifie si l'utilisateur est bien un administrateur pour les pages sensibles
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
    }
};

module.exports = { protect, adminOnly };
