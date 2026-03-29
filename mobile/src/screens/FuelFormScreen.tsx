import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/api';
import {
  normalizeBrlCurrencyInput,
  normalizeDecimalWithScale,
  normalizeKilometerInput,
  toIntegerFromMaskedInput,
  toNumberFromLocalizedInput,
} from '../lib/input';
import { createFuelEntry, getVehicle } from '../lib/services';

import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'FuelForm'>;

const FUEL_TYPES = [
  'Gasolina Comum',
  'Gasolina Aditivada',
  'Gasolina Premium',
  'Etanol',
  'GNV',
] as const;

export function FuelFormScreen({ navigation, route }: Props) {
  const { showError, showSuccess } = useToast();
  const vehicleLabel = route.params.vehicleDescription?.trim() || route.params.vehicleId;
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [currentVehicleOdometerKm, setCurrentVehicleOdometerKm] = useState<number | null>(null);
  const [fuelType, setFuelType] = useState('Gasolina Comum');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(unitPrice.trim() && quantity.trim() && odometerKm.trim() && fuelType.trim());
  }, [fuelType, odometerKm, quantity, unitPrice]);

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
    const parsedUnitPrice = toNumberFromLocalizedInput(unitPrice);
    const parsedQuantity = toNumberFromLocalizedInput(quantity);
    const parsedOdometer = toIntegerFromMaskedInput(odometerKm);

    if ([parsedUnitPrice, parsedQuantity, parsedOdometer].some((value) => Number.isNaN(value))) {
      Alert.alert('Validação', 'Preencha valor, litros e odômetro com números válidos.');
      return;
    }

    if (parsedUnitPrice <= 0 || parsedQuantity <= 0) {
      Alert.alert('Validação', 'Preço por litro e litros devem ser maiores que zero.');
      return;
    }

    if (parsedOdometer < 0) {
      Alert.alert('Validação', 'Odômetro deve ser maior ou igual a zero.');
      return;
    }

    if (notes.length > 500) {
      Alert.alert('Validação', 'Observações devem ter no máximo 500 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createFuelEntry(route.params.vehicleId, {
        odometerKm: parsedOdometer,
        unitPrice: parsedUnitPrice,
        fuelType: fuelType.trim(),
        quantity: parsedQuantity,
        notes: notes.trim() || null,
      });

      showSuccess('Abastecimento salvo com sucesso.');
      navigation.goBack();
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer title="Abastecimento" subtitle="Carregando dados do veículo...">
        <ActivityIndicator color="#2f6fed" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Abastecimento"
      subtitle={`${vehicleLabel} • Valor, litros e odômetro.`}
    >
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Preço por litro</Text>
          <TextInput
            keyboardType="decimal-pad"
            style={styles.input}
            value={unitPrice}
            onChangeText={(value) => setUnitPrice(normalizeBrlCurrencyInput(value, 3))}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Litros</Text>
          <TextInput
            keyboardType="decimal-pad"
            style={styles.input}
            value={quantity}
            onChangeText={(value) => setQuantity(normalizeDecimalWithScale(value, 2))}
          />
        </View>
        <Text style={styles.fieldHint}>Litros com no máximo 2 casas decimais.</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Quilometragem no hodômetro</Text>
          <TextInput
            keyboardType="number-pad"
            style={styles.input}
            value={odometerKm}
            onChangeText={(value) => setOdometerKm(normalizeKilometerInput(value))}
          />
          <Text style={styles.fieldHint}>Formato: 999.999 km</Text>
          <Text style={styles.fieldHint}>
            Atual do veículo: {currentVehicleOdometerKm != null ? `${currentVehicleOdometerKm} km` : '--'}
          </Text>
        </View>
        <View style={styles.fuelTypeSection}>
          <Text style={styles.fieldLabel}>Combustível</Text>
          <View style={styles.fuelTypeList}>
            {FUEL_TYPES.map((option) => {
              const selected = option === fuelType;

              return (
                <Pressable
                  key={option}
                  onPress={() => setFuelType(option)}
                  style={[styles.fuelTypeOption, selected && styles.fuelTypeOptionSelected]}
                >
                  <Text style={[styles.fuelTypeText, selected && styles.fuelTypeTextSelected]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Observações (opcional)</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </View>

      <Pressable
        style={[styles.button, (!canSubmit || isSubmitting) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Salvar abastecimento</Text>
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
  fieldLabel: {
    color: '#172034',
    fontWeight: '700',
    fontSize: 13,
  },
  fieldGroup: {
    gap: 8,
  },
  fuelTypeSection: {
    gap: 8,
  },
  fuelTypeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fuelTypeOption: {
    borderWidth: 1,
    borderColor: '#cfd6e4',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  fuelTypeOptionSelected: {
    borderColor: '#2f6fed',
    backgroundColor: '#eef4ff',
  },
  fuelTypeText: {
    color: '#5d6782',
    fontWeight: '600',
  },
  fuelTypeTextSelected: {
    color: '#2f6fed',
    fontWeight: '700',
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
