import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenContainer } from '../components/ScreenContainer';
import { getApiErrorMessage } from '../lib/api';
import { listReminders, listVehicles } from '../lib/services';

import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [dueReminderCount, setDueReminderCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const vehiclesResponse = await listVehicles({ page: 1, pageSize: 50 });
      const vehicles = vehiclesResponse.data.vehicles;
      setVehicleCount(vehicles.length);

      if (vehicles.length === 0) {
        setDueReminderCount(0);
        return;
      }

      const remindersResponses = await Promise.all(
        vehicles.map((vehicle) =>
          listReminders(vehicle.id, {
            page: 1,
            pageSize: 50,
            due: true,
          })
        )
      );

      const totalDue = remindersResponses.reduce((sum, response) => {
        return sum + response.data.reminders.length;
      }, 0);

      setDueReminderCount(totalDue);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  return (
    <ScreenContainer
      title="Resumo"
      subtitle="Próximos vencimentos e atalhos rápidos do seu controle veicular."
      refreshing={isRefreshing}
      onRefresh={() => loadSummary(true)}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Visão geral</Text>
        {isLoading ? <Text style={styles.cardText}>Carregando resumo...</Text> : null}
        {!isLoading && !error ? (
          <Text style={styles.cardText}>{vehicleCount} veículo(s) e {dueReminderCount} lembrete(s) vencido(s).</Text>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <Pressable style={styles.button} onPress={() => navigation.navigate('Vehicles')}>
        <Text style={styles.buttonText}>Ir para veículos</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.secondaryButtonText}>Perfil e configurações</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => loadSummary()}>
        <Text style={styles.secondaryButtonText}>Atualizar resumo</Text>
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
  },
  button: {
    backgroundColor: '#2f6fed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    borderColor: '#2f6fed',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#2f6fed',
    fontWeight: '700',
  },
});
