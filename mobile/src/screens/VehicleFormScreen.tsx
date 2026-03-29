import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/api';
import { normalizeKilometerInput, normalizePlateInput, toIntegerFromMaskedInput } from '../lib/input';
import { createVehicle, getVehicle, updateVehicle } from '../lib/services';

import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'VehicleForm'>;

export function VehicleFormScreen({ navigation, route }: Props) {
  const vehicleId = route.params?.vehicleId;
  const isEditMode = Boolean(vehicleId);
  const { showError, showSuccess } = useToast();

  const [description, setDescription] = useState('');
  const [plate, setPlate] = useState('');
  const [category, setCategory] = useState('');
  const [currentOdometerKm, setCurrentOdometerKm] = useState('');
  const [loadedVehicleOdometerKm, setLoadedVehicleOdometerKm] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formIsValid = useMemo(() => {
    const parsedOdometer = toIntegerFromMaskedInput(currentOdometerKm);
    return (
      description.trim().length > 0 &&
      plate.trim().length >= 7 &&
      !Number.isNaN(parsedOdometer) &&
      parsedOdometer >= 0
    );
  }, [currentOdometerKm, description, plate]);

  useEffect(() => {
    async function loadVehicle() {
      if (!vehicleId) {
        return;
      }

      try {
        const vehicle = await getVehicle(vehicleId);
        setDescription(vehicle.description);
        setPlate(vehicle.plate);
        setCategory(vehicle.category);
        setLoadedVehicleOdometerKm(vehicle.currentOdometerKm);
        setCurrentOdometerKm(normalizeKilometerInput(String(vehicle.currentOdometerKm)));
      } catch (err) {
        showError(getApiErrorMessage(err));
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    }

    loadVehicle();
  }, [navigation, showError, vehicleId]);

  const handleSubmit = async () => {
    if (!formIsValid) {
      Alert.alert('Validação', 'Descrição e placa são obrigatórias.');
      return;
    }

    const parsedOdometer = toIntegerFromMaskedInput(currentOdometerKm);

    if (Number.isNaN(parsedOdometer) || parsedOdometer < 0) {
      Alert.alert('Validação', 'Quilometragem deve ser um número maior ou igual a 0.');
      return;
    }

    if (loadedVehicleOdometerKm != null && parsedOdometer < loadedVehicleOdometerKm) {
      Alert.alert('Validação', 'A quilometragem não pode ser menor que a última atualizada do veículo.');
      return;
    }

    const payload = {
      description: description.trim(),
      plate: plate.trim().toUpperCase(),
      category: category.trim() || 'car',
      currentOdometerKm: parsedOdometer,
    };

    setIsSubmitting(true);

    try {
      if (vehicleId) {
        await updateVehicle(vehicleId, payload);
      } else {
        await createVehicle(payload);
      }

      showSuccess(vehicleId ? 'Veículo atualizado com sucesso.' : 'Veículo cadastrado com sucesso.');
      navigation.goBack();
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer title="Veículo" subtitle="Carregando dados do veículo...">
        <ActivityIndicator color="#2f6fed" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Veículo"
      subtitle={isEditMode ? 'Atualize os dados do veículo.' : 'Cadastre um novo veículo.'}
    >
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Descrição</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Placa</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="characters"
            value={plate}
            onChangeText={(value) => setPlate(normalizePlateInput(value))}
          />
        </View>
        <Text style={styles.fieldHint}>Formato recomendado: ABC1D23</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Categoria</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Quilometragem atual</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={currentOdometerKm}
            onChangeText={(value) => setCurrentOdometerKm(normalizeKilometerInput(value))}
          />
          <Text style={styles.fieldHint}>Formato: 999.999 km</Text>
          {loadedVehicleOdometerKm != null ? (
            <Text style={styles.fieldHint}>Atual do veículo: {loadedVehicleOdometerKm} km</Text>
          ) : null}
        </View>
      </View>

      <Pressable
        style={[styles.button, (!formIsValid || isSubmitting) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!formIsValid || isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar</Text>}
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
