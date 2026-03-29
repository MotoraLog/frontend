import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/api';
import { getCurrentUser } from '../lib/services';

export function ProfileScreen() {
  const { signOut, user } = useAuth();
  const { showError, showInfo } = useToast();
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const currentUser = await getCurrentUser();
      setProfileName(currentUser.name);
      setProfileEmail(currentUser.email);
      return true;
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      showError(message);
      return false;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showError]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  return (
    <ScreenContainer
      title="Perfil e configurações"
      subtitle="Dados básicos da conta e ações de sessão do MVP."
      refreshing={isRefreshing}
      onRefresh={() => loadProfile(true)}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Conta</Text>
        {isLoading ? <Text style={styles.cardText}>Carregando perfil...</Text> : null}
        <Text style={styles.cardText}>Nome: {profileName || '-'}</Text>
        <Text style={styles.cardText}>E-mail: {profileEmail || '-'}</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <Pressable
        style={styles.refreshButton}
        onPress={async () => {
          const ok = await loadProfile();
          if (ok) {
            showInfo('Perfil atualizado.');
          }
        }}
      >
        <Text style={styles.refreshText}>Atualizar dados</Text>
      </Pressable>

      <Pressable
        style={styles.logoutButton}
        onPress={async () => {
          try {
            await signOut();
          } catch {
            showError('Não foi possível sair da sessão.');
          }
        }}
      >
        <Text style={styles.logoutText}>Sair</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172034',
  },
  cardText: {
    color: '#5d6782',
  },
  errorText: {
    color: '#c03232',
    fontSize: 13,
  },
  refreshButton: {
    borderWidth: 1,
    borderColor: '#2f6fed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  refreshText: {
    color: '#2f6fed',
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#ffe7e7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#c03232',
    fontWeight: '700',
  },
});
