import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Accueil from '../screens/Accueil';
import DetailRecette from '../screens/DetailRecette';
import AjouterRecette from '../screens/AjouterRecette';
import Profil from '../screens/Profil';
import Favoris from '../screens/Favoris';
import AdminDashboard from '../screens/AdminDashboard';
import Login from '../screens/Login';
import Inscription from '../screens/Inscription';
import Notifications from '../screens/Notifications';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Accueil" component={Accueil} />
            <Stack.Screen name="DetailRecette" component={DetailRecette} />
            <Stack.Screen name="AjouterRecette" component={AjouterRecette} />
            <Stack.Screen name="Profil" component={Profil} />
            <Stack.Screen name="Favoris" component={Favoris} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Inscription" component={Inscription} />
            <Stack.Screen name="Notifications" component={Notifications} />
        </Stack.Navigator>
    );
};

export default MainNavigator;
