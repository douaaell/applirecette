import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    ActivityIndicator,
    Modal,
    FlatList
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { addRecette, updateRecette } from '../redux/slices/recetteSlice';
import { demandeModificationAPI } from '../utils/api';
import { COLORS, SPACING, SIZES, FONTS, CATEGORIES, DIFFICULTES, MESSAGES } from '../utils/constants';
import SideMenu from '../components/SideMenu';

const AjouterRecette = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const { role, user } = useSelector(state => state.auth);

    // Check if editing
    const editingRecette = route.params?.recette;
    const isEditMode = !!editingRecette;

    const [titre, setTitre] = useState('');
    const [categorie, setCategorie] = useState('plats');
    const [difficulte, setDifficulte] = useState('facile');
    const [tempsPreparation, setTempsPreparation] = useState('30');
    const [portions, setPortions] = useState('4');
    const [imageUrl, setImageUrl] = useState('');
    const [imageUri, setImageUri] = useState(null);

    // Dropdown States
    const [showCatModal, setShowCatModal] = useState(false);
    const [showDiffModal, setShowDiffModal] = useState(false);
    // Track which ingredient row has the unit modal open. null = none.
    const [openUnitIndex, setOpenUnitIndex] = useState(null);
    const [showMenu, setShowMenu] = useState(false);

    // Ingrédients
    const [ingredients, setIngredients] = useState([
        { nom: '', quantite: '', unite: 'g' },
    ]);

    // Étapes
    const [etapes, setEtapes] = useState(['']);

    const [loading, setLoading] = useState(false);

    const UNIT_OPTIONS = ['g', 'kg', 'ml', 'cl', 'l', 'c. à soupe', 'c. à café', 'pincée', 'pièce'];

    useEffect(() => {
        if (isEditMode) {
            setTitre(editingRecette.titre || '');
            setCategorie(editingRecette.categorie || 'plats');
            setDifficulte(editingRecette.difficulte || 'facile');
            setTempsPreparation(editingRecette.tempsPreparation?.toString() || '');
            setPortions(editingRecette.portions?.toString() || '4');

            setPortions(editingRecette.portions?.toString() || '4');

            // Initialiser l'image (URL ou URI locale)
            if (editingRecette.image) {
                setImageUrl(editingRecette.image);
                setImageUri(editingRecette.image);
            }

            if (editingRecette.ingredients && editingRecette.ingredients.length > 0) {
                setIngredients(editingRecette.ingredients);
            }

            if (editingRecette.etapes && editingRecette.etapes.length > 0) {
                const formattedEtapes = editingRecette.etapes.map(e => (typeof e === 'object' ? e.description : e));
                setEtapes(formattedEtapes);
            }
        }
    }, [isEditMode, editingRecette]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder aux photos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setImageUrl(''); // Clear URL if local picked
        }
    };

    const addIngredient = () => {
        setIngredients([...ingredients, { nom: '', quantite: '', unite: 'g' }]);
    };

    const removeIngredient = (index) => {
        const newIngredients = ingredients.filter((_, i) => i !== index);
        setIngredients(newIngredients);
    };

    const updateIngredient = (index, field, value) => {
        const newIngredients = [...ingredients];
        newIngredients[index][field] = value;
        setIngredients(newIngredients);
    };

    const addEtape = () => {
        setEtapes([...etapes, '']);
    };

    const removeEtape = (index) => {
        const newEtapes = etapes.filter((_, i) => i !== index);
        setEtapes(newEtapes);
    };

    const updateEtape = (index, value) => {
        const newEtapes = [...etapes];
        newEtapes[index] = value;
        setEtapes(newEtapes);
    };

    const handleSubmit = async () => {
        if (!titre.trim()) {
            Alert.alert('Erreur', 'Veuillez saisir un titre');
            return;
        }

        const validIngredients = ingredients.filter((ing) => ing.nom.trim());
        if (validIngredients.length === 0) {
            Alert.alert('Erreur', 'Veuillez ajouter au moins un ingrédient');
            return;
        }

        const validEtapes = etapes.filter((e) => e.trim());
        if (validEtapes.length === 0) {
            Alert.alert('Erreur', 'Veuillez ajouter au moins une étape');
            return;
        }

        try {
            setLoading(true);
            console.log('📤 Début soumission recette...');

            // Préparation des données
            let finalData;

            // Si une image locale a été sélectionnée (et ce n'est pas une URL HTTP)
            const isLocalImage = imageUri && !imageUri.startsWith('http');

            if (isLocalImage) {
                // Mode FormData pour upload
                finalData = new FormData();
                finalData.append('titre', titre.trim());
                finalData.append('categorie', categorie);
                finalData.append('difficulte', difficulte);
                finalData.append('tempsPreparation', tempsPreparation);
                finalData.append('portions', portions);

                // Champs complexes en JSON string
                finalData.append('ingredients', JSON.stringify(validIngredients));
                finalData.append('etapes', JSON.stringify(validEtapes));

                // Fichier image
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                finalData.append('image', {
                    uri: imageUri,
                    name: filename || 'photo.jpg',
                    type: type || 'image/jpeg',
                });
            } else {
                // Mode JSON standard (URL ou pas d'image)
                finalData = {
                    titre: titre.trim(),
                    categorie,
                    difficulte,
                    tempsPreparation: parseInt(tempsPreparation) || 0,
                    portions: parseInt(portions) || 1,
                    ingredients: validIngredients,
                    etapes: validEtapes,
                    image: imageUrl || imageUri || null, // URL textuelle
                };
            }

            if (isEditMode) {
                // TOUT LE MONDE crée une demande de modification
                console.log('📤 Création demande de modification...');

                // Préparer les modifications dans le bon format (toujours en JSON)
                const modificationsData = {
                    titre: titre.trim(),
                    categorie,
                    difficulte,
                    tempsPreparation: parseInt(tempsPreparation) || 0,
                    portions: parseInt(portions) || 1,
                    ingredients: validIngredients,
                    // Formater les étapes comme des objets avec ordre et description
                    etapes: validEtapes.map((etape, index) => ({
                        ordre: index + 1,
                        description: typeof etape === 'object' ? etape.description : etape
                    })),
                    image: imageUrl || imageUri || null,
                };

                console.log('📋 Données de modification:', modificationsData);

                const response = await demandeModificationAPI.create({
                    type: 'modification',
                    recetteId: editingRecette._id,
                    modifications: modificationsData,
                });

                console.log('✅ Demande créée:', response.data);

                console.log('✅ Demande créée:', response.data);

                // Naviguer d'abord
                navigation.navigate('DetailRecette', { recetteId: editingRecette._id });

                // Puis afficher le message (qui s'affichera par-dessus la nouvelle page)
                setTimeout(() => {
                    Alert.alert(
                        'Demande envoyée !',
                        'Votre demande de modification a été reçue et sera traitée par un administrateur.'
                    );
                }, 500);

            } else {
                console.log('📤 Création nouvelle recette...');
                await dispatch(addRecette(finalData)).unwrap();
                console.log('✅ Recette créée avec succès');
                Alert.alert('Succès', MESSAGES.RECETTE_AJOUTEE, [
                    {
                        text: 'OK', onPress: () => {
                            console.log('📤 Navigation vers page précédente...');
                            navigation.goBack();
                        }
                    }
                ]);
            }
        } catch (error) {
            console.error('❌ Erreur soumission:', error);
            Alert.alert('Erreur', error.response?.data?.message || error.message || MESSAGES.ERREUR_GENERALE);
        } finally {
            setLoading(false);
        }
    };

    const renderPickerModal = (visible, onClose, data, onSelect, title) => (
        <Modal visible={visible} transparent animationType="slide">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.pickerItem}
                                onPress={() => { onSelect(item.value); onClose(); }}
                            >
                                <Text style={styles.pickerItemText}>{item.label}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <View style={styles.container}>
            {/* Header matches mockup style: White background, centered title */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.backButton}>
                    <Ionicons name="menu" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { flex: 1, textAlign: 'center', marginRight: 32 }]}>
                    {isEditMode ? 'Modifier la recette' : 'Ajouter une recette'}
                </Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Ajouter une recette</Text>

                    {/* Nom de la recette */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nom de la recette *</Text>
                        <TextInput
                            style={styles.input}
                            value={titre}
                            onChangeText={setTitre}
                            placeholder="Nom de la recette"
                        />
                    </View>

                    {/* Catégorie & Difficulté (Row) */}
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Catégorie *</Text>
                            <View style={styles.comboInputGroup}>
                                <TextInput
                                    style={styles.comboInput}
                                    placeholder="Ex: plats"
                                    placeholderTextColor="#999"
                                    value={categorie}
                                    onChangeText={setCategorie}
                                />
                                <TouchableOpacity
                                    style={styles.comboIcon}
                                    onPress={() => setShowCatModal(true)}
                                >
                                    <Ionicons name="chevron-down" size={20} color="#333" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Difficulté *</Text>
                            <TouchableOpacity style={styles.pickerTrigger} onPress={() => setShowDiffModal(true)}>
                                <Text style={styles.pickerText}>
                                    {DIFFICULTES.find(d => d.value === difficulte)?.label || 'Facile'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#333" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Temps & Portions (Row) */}
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Temps de préparation (minutes) *</Text>
                            <TextInput
                                style={styles.input}
                                value={tempsPreparation}
                                onChangeText={setTempsPreparation}
                                keyboardType="numeric"
                                placeholder="30"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Nombre de portions *</Text>
                            <TextInput
                                style={styles.input}
                                value={portions}
                                onChangeText={setPortions}
                                keyboardType="numeric"
                                placeholder="4"
                            />
                        </View>
                    </View>

                    {/* Image URL */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>URL de l'image</Text>
                        <TextInput
                            style={styles.input}
                            value={imageUrl}
                            onChangeText={(text) => {
                                setImageUrl(text);
                                setImageUri(text); // Mettre à jour l'aperçu en temps réel
                            }}
                            placeholder="https://example.com/image.jpg"
                        />
                    </View>

                    {/* OU Pick Photo */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { textAlign: 'center', marginVertical: 10, color: '#999' }]}>OU</Text>
                        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.fullImage} />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <View style={styles.cameraCircle}>
                                        <Ionicons name="camera-outline" size={32} color="#95A5A6" />
                                    </View>
                                    <Text style={styles.imagePlaceholderText}>Ajouter une photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Ingrédients */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.label}>Ingrédients *</Text>
                        <TouchableOpacity onPress={addIngredient}>
                            <Text style={styles.addText}>+ Ajouter un ingrédient</Text>
                        </TouchableOpacity>
                    </View>

                    {ingredients.map((ing, index) => (
                        <View key={index} style={styles.ingredientRow}>
                            <TextInput
                                style={[styles.input, { flex: 2 }]}
                                placeholder="Nom de l'ingrédient"
                                value={ing.nom}
                                onChangeText={(val) => updateIngredient(index, 'nom', val)}
                            />
                            <TextInput
                                style={[styles.input, { flex: 0.8, marginHorizontal: 8 }]}
                                placeholder="Qté"
                                keyboardType="numeric"
                                value={ing.quantite}
                                onChangeText={(val) => updateIngredient(index, 'quantite', val)}
                            />
                            <View style={[styles.comboInputGroup, { flex: 2 }]}>
                                <TextInput
                                    style={[styles.comboInput, { paddingHorizontal: 10 }]}
                                    placeholder="Unité"
                                    placeholderTextColor="#999"
                                    value={ing.unite}
                                    onChangeText={(val) => updateIngredient(index, 'unite', val)}
                                />
                                <TouchableOpacity
                                    style={styles.comboIcon}
                                    onPress={() => setOpenUnitIndex(index)}
                                >
                                    <Ionicons name="chevron-down" size={20} color="#333" />
                                </TouchableOpacity>
                            </View>
                            {ingredients.length > 1 && (
                                <TouchableOpacity onPress={() => removeIngredient(index)} style={{ marginLeft: 8 }}>
                                    <Ionicons name="close-circle" size={24} color="#EF5350" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}

                    {/* Étapes */}
                    <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                        <Text style={styles.label}>Étapes de préparation *</Text>
                        <TouchableOpacity onPress={addEtape}>
                            <Text style={styles.addText}>+ Ajouter une étape</Text>
                        </TouchableOpacity>
                    </View>

                    {etapes.map((step, index) => (
                        <View key={index} style={styles.stepRow}>
                            <View style={styles.stepBadge}>
                                <Text style={styles.stepBadgeText}>{index + 1}</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.textArea, { flex: 1 }]}
                                placeholder="Décrivez cette étape..."
                                multiline
                                value={step}
                                onChangeText={(val) => updateEtape(index, val)}
                            />
                            {etapes.length > 1 && (
                                <TouchableOpacity onPress={() => removeEtape(index)} style={styles.stepDelete}>
                                    <Ionicons name="close-circle" size={24} color="#EF5350" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color="#2196F3" />
                        <Text style={styles.infoText}>
                            Votre recette sera soumise pour validation. Elle sera visible par tous une fois approuvée par un administrateur.
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.cancelLinkText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitBtn, loading && styles.disabledBtn]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitBtnText}>Soumettre la recette</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Modals for Pickers */}
            {renderPickerModal(showCatModal, () => setShowCatModal(false), CATEGORIES.filter(c => c.value), setCategorie, "Choisir une catégorie")}
            {renderPickerModal(showDiffModal, () => setShowDiffModal(false), DIFFICULTES.filter(d => d.value), setDifficulte, "Niveau de difficulté")}

            {/* Unit Picker Modal */}
            {renderPickerModal(
                openUnitIndex !== null,
                () => setOpenUnitIndex(null),
                UNIT_OPTIONS.map(u => ({ label: u, value: u })),
                (val) => updateIngredient(openUnitIndex, 'unite', val),
                "Choisir une unité"
            )}
            <SideMenu visible={showMenu} onClose={() => setShowMenu(false)} navigation={navigation} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: 'white',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    backButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    formCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 48,
        fontSize: 15,
        color: '#333',
    },
    textArea: {
        height: 80,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickerTrigger: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pickerText: {
        fontSize: 15,
        color: '#333',
        textTransform: 'capitalize',
    },
    imageBox: {
        width: '100%',
        height: 120,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    fullImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    imagePlaceholder: {
        alignItems: 'center',
    },
    cameraCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    imagePlaceholderText: {
        fontSize: 13,
        color: '#95A5A6',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    addText: {
        color: '#FF8C42',
        fontWeight: 'bold',
        fontSize: 14,
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    comboInputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        height: 48,
        backgroundColor: 'white',
    },
    comboInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#333',
    },
    comboIcon: {
        height: '100%',
        justifyContent: 'center',
        paddingHorizontal: 12,
        borderLeftWidth: 1,
        borderLeftColor: '#F0F0F0',
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    stepBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FF8C42',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginTop: 10,
    },
    stepBadgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    stepDelete: {
        marginLeft: 8,
        marginTop: 10,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        marginTop: 20,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 12,
        color: '#1565C0',
        lineHeight: 16,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 30,
        gap: 20,
    },
    cancelLinkText: {
        color: '#666',
        fontSize: 15,
        fontWeight: '500',
    },
    submitBtn: {
        backgroundColor: '#FF8C42',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        minWidth: 150,
        alignItems: 'center',
    },
    submitBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
    disabledBtn: {
        opacity: 0.6,
    },
    // Modal Picker Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    pickerItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    pickerItemText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
});

export default AjouterRecette;
