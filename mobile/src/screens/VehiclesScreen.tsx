import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenContainer } from '../components/ScreenContainer';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/api';
import { deleteVehicle, listVehicles } from '../lib/services';
import type { Vehicle } from '../lib/types';

import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Vehicles'>;

export function VehiclesScreen({ navigation }: Props) {
  const { showError, showSuccess } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestSearchRef = useRef(search);

  const loadVehicles = useCallback(async (
    nextPage = 1,
    append = false,
    searchTerm = '',
    refresh = false,
  ) => {
    if (append) {
      setIsLoadingMore(true);
    } else if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const response = await listVehicles({
        page: nextPage,
        pageSize: 10,
        search: searchTerm.trim() || undefined,
      });
      const nextVehicles = response.data.vehicles;

      setVehicles((prev) => (append ? [...prev, ...nextVehicles] : nextVehicles));
      setPage(response.meta.page);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      showError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    latestSearchRef.current = search;
  }, [search]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadVehicles(1, false, search);
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [loadVehicles, search]);

  useFocusEffect(
    useCallback(() => {
      loadVehicles(1, false, latestSearchRef.current);
    }, [loadVehicles])
  );

  const hasMorePages = page < totalPages;

  const handleDelete = useCallback((vehicle: Vehicle) => {
    Alert.alert('Excluir veículo', `Deseja excluir ${vehicle.description}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVehicle(vehicle.id);
            await loadVehicles(1, false, latestSearchRef.current);
            showSuccess('Veículo excluído com sucesso.');
          } catch (err) {
            showError(getApiErrorMessage(err));
          }
        },
      },
    ]);
  }, [loadVehicles, showError, showSuccess]);

  return (
    <ScreenContainer
      title="Veículos"
      subtitle="Lista com busca paginada e ações principais de CRUD no MVP."
      refreshing={isRefreshing}
      onRefresh={() => loadVehicles(1, false, search, true)}
    >
      {isLoading ? <Text style={styles.statusText}>Carregando veículos...</Text> : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Buscar por descrição, placa ou categoria</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      <Pressable style={styles.secondaryButton} onPress={() => loadVehicles(1, false, search)}>
        <Text style={styles.secondaryButtonText}>Buscar / atualizar</Text>
      </Pressable>

      {!isLoading && !error && vehicles.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Nenhum veículo ainda</Text>
          <Text style={styles.emptyStateText}>
            Comece cadastrando seu primeiro veículo para registrar abastecimentos e manutenções.
          </Text>
        </View>
      ) : null}

      {!isLoading && !error
        ? vehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.card}>
            <Text style={styles.cardTitle}>{vehicle.description}</Text>
            <Text style={styles.cardSubtitle}>
              {vehicle.plate} • {vehicle.category} • {vehicle.currentOdometerKm.toFixed(0)} km
            </Text>

            <View style={styles.cardActions}>
              <Pressable
                style={styles.actionButton}
                onPress={() => navigation.navigate('VehicleDetail', { vehicleId: vehicle.id })}
              >
                <Text style={styles.actionText}>Detalhe</Text>
              </Pressable>

              <Pressable
                style={styles.actionButton}
                onPress={() => navigation.navigate('VehicleForm', { vehicleId: vehicle.id })}
              >
                <Text style={styles.actionText}>Editar</Text>
              </Pressable>

              <Pressable
                style={styles.actionDangerButton}
                onPress={() => handleDelete(vehicle)}
              >
                <Text style={styles.actionDangerText}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        ))
        : null}

      <Pressable style={styles.button} onPress={() => navigation.navigate('VehicleForm')}>
        <Text style={styles.buttonText}>Cadastrar veículo</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => loadVehicles(1, false, search)}>
        <Text style={styles.secondaryButtonText}>Atualizar lista</Text>
      </Pressable>

      {!isLoading && !error && hasMorePages ? (
        <Pressable
          style={[styles.secondaryButton, isLoadingMore && styles.buttonDisabled]}
          onPress={() => loadVehicles(page + 1, true, search)}
          disabled={isLoadingMore}
        >
          <Text style={styles.secondaryButtonText}>
            {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
          </Text>
        </Pressable>
      ) : null}

      {error ? (
        <Pressable style={styles.secondaryButton} onPress={() => loadVehicles(1, false, search)}>
          <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statusText: {
    color: '#5d6782',
  },
  errorText: {
    color: '#c03232',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#cfd6e4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: '#172034',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172034',
  },
  emptyStateText: {
    color: '#5d6782',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172034',
  },
  cardSubtitle: {
    color: '#5d6782',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderColor: '#2f6fed',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  actionText: {
    color: '#2f6fed',
    fontWeight: '700',
    fontSize: 12,
  },
  actionDangerButton: {
    borderColor: '#c03232',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  actionDangerText: {
    color: '#c03232',
    fontWeight: '700',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#2f6fed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
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
