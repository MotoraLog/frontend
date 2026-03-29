import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { FuelFormScreen } from '../screens/FuelFormScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MaintenanceFormScreen } from '../screens/MaintenanceFormScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ReminderFormScreen } from '../screens/ReminderFormScreen';
import { VehicleDetailScreen } from '../screens/VehicleDetailScreen';
import { VehicleFormScreen } from '../screens/VehicleFormScreen';
import { VehiclesScreen } from '../screens/VehiclesScreen';

import type { AppStackParamList, AuthStackParamList } from './types';

const AppStack = createNativeStackNavigator<AppStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2f6fed" />
    </View>
  );
}

function AuthRoutes() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Entrar' }}
      />
    </AuthStack.Navigator>
  );
}

function AppRoutes() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Resumo' }} />
      <AppStack.Screen name="Vehicles" component={VehiclesScreen} options={{ title: 'Veículos' }} />
      <AppStack.Screen name="VehicleForm" component={VehicleFormScreen} options={{ title: 'Veículo' }} />
      <AppStack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Detalhe do veículo' }} />
      <AppStack.Screen name="FuelForm" component={FuelFormScreen} options={{ title: 'Abastecimento' }} />
      <AppStack.Screen name="MaintenanceForm" component={MaintenanceFormScreen} options={{ title: 'Manutenção' }} />
      <AppStack.Screen name="ReminderForm" component={ReminderFormScreen} options={{ title: 'Lembrete' }} />
      <AppStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil e configurações' }} />
    </AppStack.Navigator>
  );
}

export function AppNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <NavigationContainer>{session ? <AppRoutes /> : <AuthRoutes />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f6fb',
  },
});
