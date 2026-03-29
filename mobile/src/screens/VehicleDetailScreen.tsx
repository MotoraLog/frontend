import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenContainer } from '../components/ScreenContainer';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/api';
import { formatCurrencyBrl, normalizeKilometerInput, toIntegerFromMaskedInput } from '../lib/input';
import {
  getVehicle,
  listFuelEntries,
  listMaintenanceEntries,
  listReminders,
  updateVehicleOdometer,
} from '../lib/services';
import type { FuelEntry, MaintenanceEntry, Reminder, Vehicle } from '../lib/types';

import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'VehicleDetail'>;

type TabKey = 'fuel' | 'maintenance' | 'reminders';
const PAGE_SIZE = 10;

export function VehicleDetailScreen({ navigation, route }: Props) {
  const { vehicleId } = route.params;
  const { showError, showSuccess } = useToast();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [maintenanceEntries, setMaintenanceEntries] = useState<MaintenanceEntry[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabKey>('fuel');
  const [odometerInput, setOdometerInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingOdometer, setIsUpdatingOdometer] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fuelPage, setFuelPage] = useState(1);
  const [fuelTotalPages, setFuelTotalPages] = useState(1);
  const [maintenancePage, setMaintenancePage] = useState(1);
  const [maintenanceTotalPages, setMaintenanceTotalPages] = useState(1);
  const [reminderPage, setReminderPage] = useState(1);
  const [reminderTotalPages, setReminderTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const [vehicleData, fuelData, maintenanceData, reminderData] = await Promise.all([
        getVehicle(vehicleId),
        listFuelEntries(vehicleId, { page: 1, pageSize: PAGE_SIZE }),
        listMaintenanceEntries(vehicleId, { page: 1, pageSize: PAGE_SIZE }),
        listReminders(vehicleId, { page: 1, pageSize: PAGE_SIZE }),
      ]);

      setVehicle(vehicleData);
      setFuelEntries(fuelData.data.fuelEntries);
      setMaintenanceEntries(maintenanceData.data.maintenanceEntries);
      setReminders(reminderData.data.reminders);
      setFuelPage(fuelData.meta.page);
      setFuelTotalPages(fuelData.meta.totalPages);
      setMaintenancePage(maintenanceData.meta.page);
      setMaintenanceTotalPages(maintenanceData.meta.totalPages);
      setReminderPage(reminderData.meta.page);
      setReminderTotalPages(reminderData.meta.totalPages);
      setOdometerInput(normalizeKilometerInput(String(vehicleData.currentOdometerKm)));
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      showError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showError, vehicleId]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const handleUpdateOdometer = async () => {
    const parsedOdometer = toIntegerFromMaskedInput(odometerInput);

    if (Number.isNaN(parsedOdometer)) {
      Alert.alert('Validação', 'Informe uma quilometragem válida.');
      return;
    }

    if (vehicle && parsedOdometer < vehicle.currentOdometerKm) {
      Alert.alert('Validação', 'A quilometragem não pode ser menor que a última atualizada do veículo.');
      return;
    }

    setIsUpdatingOdometer(true);

    try {
      await updateVehicleOdometer(vehicleId, { odometerKm: parsedOdometer });
      await loadAll();
      showSuccess('Quilometragem atualizada com sucesso.');
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setIsUpdatingOdometer(false);
    }
  };

  const renderTabContent = () => {
    if (selectedTab === 'fuel') {
      if (fuelEntries.length === 0) {
        return <Text style={styles.mutedText}>Nenhum abastecimento registrado.</Text>;
      }

      return fuelEntries.map((entry) => (
        <View key={entry.id} style={styles.listCard}>
          <Text style={styles.listCardTitle}>{entry.fuelType}</Text>
          <Text style={styles.listCardText}>
            {entry.quantity.toFixed(2)} L • {formatCurrencyBrl(entry.totalPrice)} • {entry.odometerKm} km
          </Text>
        </View>
      ));
    }

    if (selectedTab === 'maintenance') {
      if (maintenanceEntries.length === 0) {
        return <Text style={styles.mutedText}>Nenhuma manutenção registrada.</Text>;
      }

      return maintenanceEntries.map((entry) => (
        <View key={entry.id} style={styles.listCard}>
          <Text style={styles.listCardTitle}>{entry.maintenanceType}</Text>
          <Text style={styles.listCardText}>
            {entry.price != null ? `${formatCurrencyBrl(entry.price)} • ` : ''}
            {entry.odometerKm} km • {entry.notes ?? 'Sem observações'}
          </Text>
        </View>
      ));
    }

    if (reminders.length === 0) {
      return <Text style={styles.mutedText}>Nenhum lembrete criado.</Text>;
    }

    return reminders.map((reminder) => (
      <View key={reminder.id} style={styles.listCard}>
        <Text style={styles.listCardTitle}>{reminder.reminderText}</Text>
        <Text style={styles.listCardText}>
          Status: {reminder.status} • Vencido: {reminder.dueState.isDue ? 'Sim' : 'Não'}
        </Text>
      </View>
    ));
  };

  const loadMoreForSelectedTab = async () => {
    setIsLoadingMore(true);

    try {
      if (selectedTab === 'fuel' && fuelPage < fuelTotalPages) {
        const response = await listFuelEntries(vehicleId, {
          page: fuelPage + 1,
          pageSize: PAGE_SIZE,
        });

        setFuelEntries((prev) => [...prev, ...response.data.fuelEntries]);
        setFuelPage(response.meta.page);
        setFuelTotalPages(response.meta.totalPages);
      }

      if (selectedTab === 'maintenance' && maintenancePage < maintenanceTotalPages) {
        const response = await listMaintenanceEntries(vehicleId, {
          page: maintenancePage + 1,
          pageSize: PAGE_SIZE,
        });

        setMaintenanceEntries((prev) => [...prev, ...response.data.maintenanceEntries]);
        setMaintenancePage(response.meta.page);
        setMaintenanceTotalPages(response.meta.totalPages);
      }

      if (selectedTab === 'reminders' && reminderPage < reminderTotalPages) {
        const response = await listReminders(vehicleId, {
          page: reminderPage + 1,
          pageSize: PAGE_SIZE,
        });

        setReminders((prev) => [...prev, ...response.data.reminders]);
        setReminderPage(response.meta.page);
        setReminderTotalPages(response.meta.totalPages);
      }
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const selectedHasMore =
    (selectedTab === 'fuel' && fuelPage < fuelTotalPages) ||
    (selectedTab === 'maintenance' && maintenancePage < maintenanceTotalPages) ||
    (selectedTab === 'reminders' && reminderPage < reminderTotalPages);

  return (
    <ScreenContainer
      title="Detalhe do veículo"
      subtitle={vehicle ? `${vehicle.description} • ${vehicle.plate}` : `ID: ${vehicleId}`}
      refreshing={isRefreshing}
      onRefresh={() => loadAll(true)}
    >
      {isLoading ? <Text style={styles.mutedText}>Carregando dados do veículo...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {error ? (
        <Pressable style={styles.secondaryButton} onPress={() => loadAll()}>
          <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
        </Pressable>
      ) : null}

      <View style={styles.odometerCard}>
        <Text style={styles.cardTitle}>
          Última quilometragem: <Text style={styles.cardValue}>{vehicle ? `${vehicle.currentOdometerKm.toFixed(0)} km` : '--'}</Text>
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Atualizar quilometragem</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={odometerInput}
            onChangeText={(value) => setOdometerInput(normalizeKilometerInput(value))}
          />
          <Text style={styles.infoText}>Formato: 999.999 km</Text>
        </View>

        <Pressable
          style={[styles.secondaryButton, isUpdatingOdometer && styles.buttonDisabled]}
          onPress={handleUpdateOdometer}
          disabled={isUpdatingOdometer}
        >
          <Text style={styles.secondaryButtonText}>Salvar quilometragem</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.button}
        onPress={() =>
          navigation.navigate('FuelForm', {
            vehicleId,
            vehicleDescription: vehicle?.description,
          })
        }
      >
        <Text style={styles.buttonText}>Adicionar abastecimento</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() =>
          navigation.navigate('MaintenanceForm', {
            vehicleId,
            vehicleDescription: vehicle?.description,
          })
        }
      >
        <Text style={styles.buttonText}>Adicionar manutenção</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() =>
          navigation.navigate('ReminderForm', {
            vehicleId,
            vehicleDescription: vehicle?.description,
          })
        }
      >
        <Text style={styles.buttonText}>Adicionar lembrete</Text>
      </Pressable>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabButton, selectedTab === 'fuel' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('fuel')}
        >
          <Text style={[styles.tabText, selectedTab === 'fuel' && styles.tabTextActive]}>Abastecimentos</Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, selectedTab === 'maintenance' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('maintenance')}
        >
          <Text style={[styles.tabText, selectedTab === 'maintenance' && styles.tabTextActive]}>Manutenções</Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, selectedTab === 'reminders' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('reminders')}
        >
          <Text style={[styles.tabText, selectedTab === 'reminders' && styles.tabTextActive]}>Lembretes</Text>
        </Pressable>
      </View>

      {renderTabContent()}

      {!isLoading && !error && selectedHasMore ? (
        <Pressable
          style={[styles.secondaryButton, isLoadingMore && styles.buttonDisabled]}
          onPress={loadMoreForSelectedTab}
          disabled={isLoadingMore}
        >
          <Text style={styles.secondaryButtonText}>
            {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
          </Text>
        </Pressable>
      ) : null}

      <Text style={styles.infoText}>
        Observação: o backend atual expõe listagem e criação para abastecimentos, manutenções e lembretes.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: '#5d6782',
  },
  errorText: {
    color: '#c03232',
  },
  odometerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    color: '#5d6782',
  },
  cardValue: {
    fontWeight: '700',
    color: '#172034',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cfd6e4',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: '#172034',
    fontWeight: '700',
    fontSize: 13,
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
    borderWidth: 1,
    borderColor: '#2f6fed',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2f6fed',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d5dbeb',
    backgroundColor: '#fff',
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderColor: '#2f6fed',
    backgroundColor: '#eef4ff',
  },
  tabText: {
    color: '#5d6782',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#2f6fed',
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  listCardTitle: {
    color: '#172034',
    fontWeight: '700',
  },
  listCardText: {
    color: '#5d6782',
  },
  infoText: {
    color: '#5d6782',
    fontSize: 12,
  },
});
