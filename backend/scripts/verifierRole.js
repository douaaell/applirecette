// Script pour vérifier et corriger le rôle des utilisateurs
// Usage: 
//   - Lister tous les admins: node scripts/verifierRole.js list-admins
//   - Vérifier un utilisateur: node scripts/verifierRole.js <email>
//   - Corriger un utilisateur: node scripts/verifierRole.js <email> <role>
//   - Corriger tous les admins: node scripts/verifierRole.js fix-all-admins
// Exemple: node scripts/verifierRole.js dou@test.com ADMIN

require('dotenv').config();
const mongoose = require('mongoose');
const Utilisateur = require('../models/Utilisateur');

const connectDB = async () => {
    try {
        // Utiliser la même URI 
        const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/recetteApp';
        const conn = await mongoose.connect(MONGODB_URI);



    } catch (error) {
        console.error('❌ Erreur connexion MongoDB:', error);
        process.exit(1);
    }
};

const listerAdmins = async () => {
    await connectDB();
    try {
        // Chercher avec différentes variantes pour être sûr
        const admins1 = await Utilisateur.find({ role: 'ADMIN' });
        const admins2 = await Utilisateur.find({ role: 'admin' });
        const admins3 = await Utilisateur.find({ role: /^admin$/i }); // Case insensitive
        
        // Combiner et dédupliquer
        const allAdmins = [...admins1, ...admins2, ...admins3];
        const uniqueAdmins = Array.from(new Map(allAdmins.map(a => [a._id.toString(), a])).values());
        

        uniqueAdmins.forEach((admin, index) => {





        });
        
        // Aussi lister tous les utilisateurs pour debug
        const tous = await Utilisateur.find({});


        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
};

const corrigerTousAdmins = async () => {
    await connectDB();
    try {
        // D'abord, lister tous les utilisateurs pour voir ce qui se passe
        const tous = await Utilisateur.find({});

        
        // Chercher avec différentes variantes
        const admins1 = await Utilisateur.find({ role: 'ADMIN' });
        const admins2 = await Utilisateur.find({ role: 'admin' });
        const admins3 = await Utilisateur.find({ role: /^admin$/i });
        



        
        // Afficher tous les rôles uniques
        const rolesUniques = [...new Set(tous.map(u => u.role))];

        
        // Afficher tous les utilisateurs pour debug

        tous.forEach((u, idx) => {

        });
        
        // Chercher manuellement dans tous les utilisateurs
        const adminsManuels = tous.filter(u => {
            const roleStr = String(u.role || '').toUpperCase();
            return roleStr === 'ADMIN';
        });
        
        // Si aucun admin trouvé mais qu'on sait qu'il devrait y en avoir, 
        // on peut forcer la mise à jour pour des emails spécifiques
        const emailsAdmins = ['dou@test.com', 'demo@test.com'];
        const adminsAForcer = tous.filter(u => emailsAdmins.includes(u.email));
        


        
        let corriges = 0;
        
        // D'abord corriger ceux trouvés manuellement
        for (const admin of adminsManuels) {
            const roleActuel = String(admin.role || '').toUpperCase();
            if (roleActuel !== 'ADMIN') {

                admin.role = 'ADMIN';
                await admin.save();
                corriges++;
            } else {
                // S'assurer que c'est bien stocké comme 'ADMIN' en majuscules
                if (admin.role !== 'ADMIN') {

                    admin.role = 'ADMIN';
                    await admin.save();
                    corriges++;
                } else {

                }
            }
        }
        
        // Ensuite forcer les emails connus pour être admin
        for (const user of adminsAForcer) {
            if (user.role !== 'ADMIN') {

                user.role = 'ADMIN';
                await user.save();
                corriges++;
            } else {

            }
        }
        
        // Utiliser updateMany pour forcer directement dans MongoDB (bypass Mongoose)
        if (emailsAdmins.length > 0) {

            const result = await Utilisateur.updateMany(
                { email: { $in: emailsAdmins } },
                { $set: { role: 'ADMIN' } }
            );

            if (result.modifiedCount > 0) {
                corriges += result.modifiedCount;
            }
        }
        
        // Vérification finale
        const verification = await Utilisateur.find({ email: { $in: emailsAdmins } });

        verification.forEach(u => {

        });
        

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
};

const verifierRole = async () => {
    const command = process.argv[2];
    const email = process.argv[2];
    const nouveauRole = process.argv[3]?.toUpperCase();

    // Commandes spéciales
    if (command === 'list-admins') {
        await listerAdmins();
        return;
    }
    
    if (command === 'fix-all-admins') {
        await corrigerTousAdmins();
        return;
    }

    if (!email || email.includes('@') === false) {
        console.error('❌ Usage:');





        process.exit(1);
    }

    await connectDB();

    try {
        const utilisateur = await Utilisateur.findOne({ email });

        if (!utilisateur) {
            console.error(`❌ Utilisateur avec email ${email} non trouvé`);
            process.exit(1);
        }







        if (nouveauRole && (nouveauRole === 'ADMIN' || nouveauRole === 'USER')) {
            if (utilisateur.role !== nouveauRole) {
                utilisateur.role = nouveauRole;
                await utilisateur.save();

            } else {

            }
        } else {

        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
};

verifierRole();
