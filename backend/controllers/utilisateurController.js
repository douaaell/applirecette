// backend/controllers/utilisateurController.js
const Utilisateur = require('../models/Utilisateur');
const Recette = require('../models/Recette');
const Commentaire = require('../models/Commentaire');
const admin = require('../config/firebaseAdmin');

const syncUser = async (req, res) => {
    // console.log('\n=== Début syncUser ===');
    // console.log('Données Firebase reçues:', req.userFirebase);
    // console.log('Données Body reçues:', req.body);

    if (!req.userFirebase || !req.userFirebase.uid) {
        return res.status(400).json({ message: 'Données utilisateur manquantes' });
    }

    const { uid, email } = req.userFirebase;
    // Données venant du formulaire d'inscription (prioritaires)
    const { nom, prenom } = req.body;

    try {
        let utilisateur = await Utilisateur.findOne({ uid });

        if (!utilisateur) {
            // Création propre si le middleware ne l'a pas fait (peu probable mais possible)
            console.log('Création d\'un nouvel utilisateur pour UID:', uid);
            const userData = {
                uid,
                email: email || `${uid}@applirecette.com`,
                nom: nom || 'Utilisateur',
                prenom: prenom || 'Utilisateur',
                role: 'USER'
            };
            utilisateur = new Utilisateur(userData);
            await utilisateur.save();
            console.log(`✅ SUCCÈS : Utilisateur ${nom} ${prenom} créé dans MongoDB !`);
        } else {
            // Mise à jour des infos si fournies (important pour l'inscription qui envoie nom/prenom)
            // IMPORTANT: Préserver le rôle existant
            const roleAvant = utilisateur.role;
            if (nom || prenom) {
                console.log('Mise à jour utilisateur existant avec infos formulaire');
                if (nom) utilisateur.nom = nom;
                if (prenom) utilisateur.prenom = prenom;
                await utilisateur.save();
            }
            // Vérifier que le rôle n'a pas été modifié
            if (utilisateur.role !== roleAvant) {
                console.error(`❌ ERREUR: Le rôle a changé de ${roleAvant} à ${utilisateur.role}, restauration...`);
                utilisateur.role = roleAvant;
                await utilisateur.save();
            }
        }
        res.json(utilisateur);

    } catch (error) {
        console.error('Erreur lors de la synchronisation:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

const getProfil = async (req, res) => {
    if (req.user) {
        // Récupérer l'utilisateur frais depuis la base pour s'assurer d'avoir le bon rôle
        const utilisateurFrais = await Utilisateur.findById(req.user._id);

        if (!utilisateurFrais) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        console.log(`📋 getProfil - Rôle depuis MongoDB: ${utilisateurFrais.role}, Email: ${utilisateurFrais.email}`);
        console.log(`📋 Rôle depuis req.user: ${req.user.role}`);

        // Utiliser le rôle depuis la base de données (source de vérité)
        const profil = utilisateurFrais.toObject ? utilisateurFrais.toObject() : utilisateurFrais;

        // S'assurer que le rôle est bien ADMIN si c'est le cas dans la base
        if (utilisateurFrais.role === 'ADMIN' && profil.role !== 'ADMIN') {
            console.warn(`⚠️ Incohérence de rôle détectée, correction...`);
            profil.role = 'ADMIN';
        }

        console.log(`📋 Profil final retourné avec rôle: ${profil.role}`);
        return res.json(profil);
    }
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
};

const getFavoris = async (req, res) => {
    try {
        const user = await Utilisateur.findById(req.user._id).populate('favoris');
        res.json(user.favoris);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addFavori = async (req, res) => {
    try {
        const { recetteId } = req.body;
        const user = await Utilisateur.findById(req.user._id);

        if (!user.favoris.includes(recetteId)) {
            user.favoris.push(recetteId);
            await user.save();
        }
        await user.populate('favoris');
        res.json(user.favoris);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const removeFavori = async (req, res) => {
    try {
        const recetteId = req.params.recetteId;
        const user = await Utilisateur.findById(req.user._id);

        user.favoris = user.favoris.filter(id => id.toString() !== recetteId);
        await user.save();
        await user.populate('favoris');
        res.json(user.favoris);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- ADMIN CONTROLLERS ---

const getStats = async (req, res) => {
    try {
        const totalUtilisateurs = await Utilisateur.countDocuments();
        const totalRecettesApprouvees = await Recette.countDocuments({ statut: 'APPROUVEE' });
        const totalRecettesEnAttente = await Recette.countDocuments({ statut: 'EN_ATTENTE' });
        const totalCommentaires = await Commentaire.countDocuments();

        return res.json({
            totalUtilisateurs,
            totalRecettesApprouvees,
            totalRecettesEnAttente,
            totalCommentaires,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getAllUtilisateurs = async (req, res) => {
    try {
        const utilisateurs = await Utilisateur.find({}).sort({ createdAt: -1 });
        res.json(utilisateurs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const changerRole = async (req, res) => {
    try {
        const { role } = req.body;
        const utilisateur = await Utilisateur.findById(req.params.id);
        if (!utilisateur) return res.status(404).json({ message: 'Utilisateur non trouvé' });
        utilisateur.role = role;
        await utilisateur.save();
        res.json(utilisateur);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteUtilisateur = async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.params.id);
        if (!utilisateur) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        // Supprimer de Firebase si UID présent
        if (utilisateur.uid) {
            try {
                await admin.auth().deleteUser(utilisateur.uid);
                console.log(`✅ Utilisateur Firebase ${utilisateur.uid} supprimé`);
            } catch (firebaseError) {
                console.warn(`⚠️ Erreur suppression Firebase (ou utilisateur déjà supprimé): ${firebaseError.message}`);
            }
        }

        await utilisateur.deleteOne();
        res.json({ message: 'Utilisateur supprimé de MongoDB et Firebase' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const syncAllUsersFromFirebase = async (req, res) => {
    try {
        // Récupérer tous les utilisateurs Firebase (avec pagination si nécessaire)
        let allFirebaseUsers = [];
        let nextPageToken = undefined;

        do {
            let listUsersResult;
            if (nextPageToken) {
                listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            } else {
                listUsersResult = await admin.auth().listUsers(1000);
            }

            if (listUsersResult && listUsersResult.users) {
                allFirebaseUsers = allFirebaseUsers.concat(listUsersResult.users);
                nextPageToken = listUsersResult.pageToken;
            } else {
                nextPageToken = undefined;
            }
        } while (nextPageToken);

        console.log(`📊 ${allFirebaseUsers.length} utilisateur(s) trouvé(s) dans Firebase`);

        // Lister tous les UIDs Firebase pour debug
        const firebaseUids = allFirebaseUsers.map(u => u.uid).filter(Boolean);
        console.log(`📋 UIDs Firebase:`, firebaseUids);

        const syncedUsers = [];
        const updatedUsers = [];
        const errors = [];
        const skipped = [];

        for (const userRecord of allFirebaseUsers) {
            try {
                const { uid, email, displayName } = userRecord;

                if (!uid) {
                    console.warn(`⚠️ Utilisateur Firebase sans UID ignoré`);
                    continue;
                }

                // Chercher par UID d'abord, puis par email
                let utilisateur = await Utilisateur.findOne({ uid });

                if (!utilisateur && email) {
                    // Si pas trouvé par UID, chercher par email
                    utilisateur = await Utilisateur.findOne({ email });
                }

                if (!utilisateur) {
                    // Créer un nouvel utilisateur
                    const nameParts = (displayName || email?.split('@')[0] || 'Utilisateur').split(' ');
                    const emailFinal = email || `${uid}@applirecette.com`;

                    // Vérifier si un utilisateur existe déjà avec cet email mais sans UID
                    const existingByEmail = await Utilisateur.findOne({ email: emailFinal });
                    if (existingByEmail) {
                        // Mettre à jour l'UID manquant
                        existingByEmail.uid = uid;
                        await existingByEmail.save();
                        updatedUsers.push(existingByEmail);
                        console.log(`✅ UID ajouté à l'utilisateur existant: ${emailFinal}`);
                        continue;
                    }

                    const userData = {
                        uid,
                        email: emailFinal,
                        nom: nameParts.length > 1 ? nameParts.slice(1).join(' ') : (nameParts[0] || 'Utilisateur'),
                        prenom: nameParts.length > 1 ? nameParts[0] : (nameParts[0] || 'Utilisateur'),
                        role: 'USER' // Nouveaux utilisateurs = USER par défaut
                    };

                    try {
                        utilisateur = new Utilisateur(userData);
                        await utilisateur.save();
                        syncedUsers.push(utilisateur);
                        console.log(`✅ Nouvel utilisateur créé: ${emailFinal} (UID: ${uid})`);
                    } catch (saveError) {
                        console.error(`❌ Erreur lors de la création de ${emailFinal}:`, saveError.message);
                        if (saveError.code === 11000) {
                            // Duplicate key error - essayer de récupérer l'utilisateur existant
                            console.warn(`⚠️ Conflit pour ${emailFinal}, tentative de récupération...`);

                            // Essayer de trouver par email
                            let existing = await Utilisateur.findOne({ email: emailFinal });
                            if (!existing) {
                                // Essayer de trouver par UID
                                existing = await Utilisateur.findOne({ uid });
                            }

                            if (existing) {
                                // Mettre à jour les champs manquants
                                let modified = false;
                                if (!existing.uid) {
                                    existing.uid = uid;
                                    modified = true;
                                }
                                if (!existing.email || existing.email !== emailFinal) {
                                    existing.email = emailFinal;
                                    modified = true;
                                }
                                if (modified) {
                                    await existing.save();
                                    updatedUsers.push(existing);
                                    console.log(`✅ Utilisateur existant mis à jour: ${emailFinal}`);
                                } else {
                                    skipped.push({ email: emailFinal, reason: 'Déjà synchronisé' });
                                }
                            } else {
                                errors.push({ email: emailFinal, uid, error: 'Conflit non résolu - utilisateur introuvable' });
                            }
                        } else {
                            errors.push({ email: emailFinal, uid, error: saveError.message });
                        }
                    }
                } else {
                    // Mettre à jour les infos mais PRÉSERVER le rôle existant
                    const roleAvant = utilisateur.role;
                    const nameParts = (displayName || email?.split('@')[0] || 'Utilisateur').split(' ');

                    // Mettre à jour l'UID si manquant
                    if (!utilisateur.uid && uid) {
                        utilisateur.uid = uid;
                    }

                    utilisateur.email = email || utilisateur.email;
                    utilisateur.nom = nameParts.length > 1 ? nameParts.slice(1).join(' ') : (nameParts[0] || utilisateur.nom);
                    utilisateur.prenom = nameParts.length > 1 ? nameParts[0] : (nameParts[0] || utilisateur.prenom);

                    // IMPORTANT: Ne pas toucher au rôle
                    await utilisateur.save();

                    if (utilisateur.role !== roleAvant) {
                        console.warn(`⚠️ Rôle modifié pour ${email}, restauration...`);
                        utilisateur.role = roleAvant;
                        await utilisateur.save();
                    }
                    updatedUsers.push(utilisateur);
                }
            } catch (userError) {
                console.error(`❌ Erreur pour utilisateur ${userRecord.uid}:`, userError.message);
                errors.push({ uid: userRecord.uid, error: userError.message });
            }
        }

        const totalMongo = await Utilisateur.countDocuments();

        // Vérifier les UIDs manquants
        const mongoUids = (await Utilisateur.find({}, 'uid')).map(u => u.uid).filter(Boolean);
        const missingUids = firebaseUids.filter(fuid => !mongoUids.includes(fuid));

        if (missingUids.length > 0) {
            console.warn(`⚠️ ${missingUids.length} UID(s) Firebase non trouvé(s) dans MongoDB:`, missingUids);
        }

        res.json({
            message: `Synchronisation terminée. ${syncedUsers.length} nouveaux utilisateurs ajoutés, ${updatedUsers.length} mis à jour. Total MongoDB: ${totalMongo}`,
            count: syncedUsers.length,
            updated: updatedUsers.length,
            totalFirebase: allFirebaseUsers.length,
            totalMongo: totalMongo,
            missing: missingUids.length > 0 ? missingUids : undefined,
            errors: errors.length > 0 ? errors : undefined,
            skipped: skipped.length > 0 ? skipped.length : undefined
        });

    } catch (error) {
        console.error('Erreur syncAllUsersFromFirebase:', error);
        res.status(500).json({ message: error.message });
    }
};

const cleanupFirebaseUsers = async (req, res) => {
    try {
        console.log('🧹 Démarrage du nettoyage des utilisateurs Firebase orphelins...');

        // 1. Récupérer tous les UIDs de MongoDB
        const mongoUsers = await Utilisateur.find({}, 'uid');
        const mongoUids = new Set(mongoUsers.map(u => u.uid).filter(Boolean));
        console.log(`📋 ${mongoUids.size} utilisateurs dans MongoDB`);

        // 2. Récupérer tous les utilisateurs Firebase
        let allFirebaseUsers = [];
        let nextPageToken = undefined;
        do {
            let result;
            if (nextPageToken) {
                result = await admin.auth().listUsers(1000, nextPageToken);
            } else {
                result = await admin.auth().listUsers(1000);
            }

            if (result && result.users) {
                allFirebaseUsers = allFirebaseUsers.concat(result.users);
                nextPageToken = result.pageToken;
            } else {
                nextPageToken = undefined;
            }
        } while (nextPageToken);
        console.log(`📋 ${allFirebaseUsers.length} utilisateurs dans Firebase`);

        // 3. Identifier les orphelins (Firebase UIDs qui ne sont PAS dans MongoDB)
        // On exclut l'admin actuel pour éviter de se supprimer soi-même par erreur !
        const currentAdminUid = req.userFirebase ? req.userFirebase.uid : null;

        const orphans = allFirebaseUsers.filter(user => {
            if (user.uid === currentAdminUid) return false; // Ne pas supprimer l'admin courant
            return !mongoUids.has(user.uid);
        });

        console.log(`⚠️ ${orphans.length} utilisateurs orphelins trouvés à supprimer`);

        // 4. Supprimer les orphelins
        const deletedUids = [];
        const errors = [];

        for (const orphan of orphans) {
            try {
                await admin.auth().deleteUser(orphan.uid);
                deletedUids.push(orphan.uid);
                console.log(`🗑️ Supprimé de Firebase: ${orphan.email} (${orphan.uid})`);
            } catch (err) {
                console.error(`❌ Echec suppression ${orphan.uid}:`, err.message);
                errors.push({ uid: orphan.uid, error: err.message });
            }
        }

        res.json({
            message: `Nettoyage terminé. ${deletedUids.length} utilisateurs supprimés de Firebase.`,
            deletedCount: deletedUids.length,
            errorsCount: errors.length,
            details: { deleted: deletedUids, errors }
        });

    } catch (error) {
        console.error('Erreur cleanupFirebaseUsers:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    syncUser,
    getProfil,
    getStats,
    getAllUtilisateurs,
    changerRole,
    changerRole,
    deleteUtilisateur,
    syncAllUsersFromFirebase,
    getFavoris,
    addFavori,
    removeFavori,
    cleanupFirebaseUsers
};