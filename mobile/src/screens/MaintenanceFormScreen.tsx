import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/api';
import {
  normalizeBrlCurrencyInput,
  normalizeKilometerInput,
  toIntegerFromMaskedInput,
  toNumberFromLocalizedInput,
} from '../lib/input';
import { createMaintenanceEntry, getVehicle } from '../lib/services';

import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'MaintenanceForm'>;

export function MaintenanceFormScreen({ navigation, route }: Props) {
  const { showError, showSuccess } = useToast();
  const vehicleLabel = route.params.vehicleDescription?.trim() || route.params.vehicleId;
  const [maintenanceType, setMaintenanceType] = useState('');
  const [price, setPrice] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [currentVehicleOdometerKm, setCurrentVehicleOdometerKm] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => maintenanceType.trim().length > 0 && price.trim().length > 0 && odometerKm.trim().length > 0,
    [maintenanceType, odometerKm, price]
  );

  useEffect(() => {
    async function loadVehicle() {
      try {
        const vehicle = await getVehicle(route.params.vehicleId);
        setCurrentVehicleOdometerKm(vehicle.currentOdometerKm);
        setOdometerKm(normalizeKilometerInput(String(vehicle.currentOdometerKm)));
      } catch (err) {
        showError(getApiErrorMessage(err));
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    }

    loadVehicle();
  }, [navigation, route.params.vehicleId, showError]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const parsedPrice = toNumberFromLocalizedInput(price);
    const parsedOdometer = toIntegerFromMaskedInput(odometerKm);

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Validação', 'Informe um preço válido maior que zero.');
      return;
    }

    if (Number.isNaN(parsedOdometer) || parsedOdometer < 0) {
      Alert.alert('Validação', 'Informe uma quilometragem válida.');
      return;
    }

    if (notes.length > 500) {
      Alert.alert('Validação', 'Observações devem ter no máximo 500 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createMaintenanceEntry(route.params.vehicleId, {
        maintenanceType: maintenanceType.trim(),
        price: parsedPrice,
        odometerKm: parsedOdometer,
        notes: notes.trim() || null,
      });

      showSuccess('Manutenção salva com sucesso.');
      navigation.goBack();
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer title="Manutenção" subtitle="Carregando dados do veículo...">
        <ActivityIndicator color="#2f6fed" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Manutenção"
      subtitle={`${vehicleLabel} • Tipo, custo e quilometragem.`}
    >
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Tipo de manutenção</Text>
          <TextInput
            style={styles.input}
            value={maintenanceType}
            onChangeText={setMaintenanceType}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Preço</Text>
          <TextInput
            keyboardType="decimal-pad"
            style={styles.input}
            value={price}
            onChangeText={(value) => setPrice(normalizeBrlCurrencyInput(value, 3))}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Quilometragem no hodômetro</Text>
          <TextInput
            keyboardType="number-pad"
            style={styles.input}
            value={odometerKm}
            onChangeText={(value) => setOdometerKm(normalizeKilometerInput(value))}
          />
          <Text style={styles.fieldHint}>
            Atual do veículo: {currentVehicleOdometerKm != null ? `${currentVehicleOdometerKm} km` : '--'}
          </Text>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Observações (opcional)</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
          />
        </View>
        <Text style={styles.fieldHint}>{notes.length}/500 caracteres</Text>
      </View>

      <Pressable
        style={[styles.button, (!canSubmit || isSubmitting) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Salvar manutenção</Text>
        )}
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cfd6e4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  fieldHint: {
    color: '#5d6782',
    fontSize: 12,
    marginTop: -6,
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
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
