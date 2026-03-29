import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </ToastProvider>
    </AuthProvider>
  );
}
