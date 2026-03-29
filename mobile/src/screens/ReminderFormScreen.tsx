import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/api';
import { normalizeIntegerInput } from '../lib/input';
import { createReminder } from '../lib/services';

import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'ReminderForm'>;

export function ReminderFormScreen({ navigation, route }: Props) {
  const { showError, showSuccess } = useToast();
  const vehicleLabel = route.params.vehicleDescription?.trim() || route.params.vehicleId;
  const [reminderText, setReminderText] = useState('');
  const [mileageIntervalKm, setMileageIntervalKm] = useState('');
  const [monthInterval, setMonthInterval] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasAnyTrigger = mileageIntervalKm.trim().length > 0 || monthInterval.trim().length > 0;

  const handleSubmit = async () => {
    const parsedMileageInterval = mileageIntervalKm.trim()
      ? Number(mileageIntervalKm)
      : null;
    const parsedMonthInterval = monthInterval.trim()
      ? Number(monthInterval)
      : null;

    if (!reminderText.trim()) {
      Alert.alert('Validação', 'Informe o texto do lembrete.');
      return;
    }

    if (parsedMileageInterval == null && parsedMonthInterval == null) {
      Alert.alert('Validação', 'Informe ao menos um gatilho: quilometragem ou meses.');
      return;
    }

    if (
      (parsedMileageInterval != null && Number.isNaN(parsedMileageInterval)) ||
      (parsedMonthInterval != null && Number.isNaN(parsedMonthInterval))
    ) {
      Alert.alert('Validação', 'Use números válidos nos gatilhos.');
      return;
    }

    if (parsedMileageInterval != null && parsedMileageInterval < 0) {
      Alert.alert('Validação', 'Intervalo em km deve ser maior ou igual a zero.');
      return;
    }

    if (parsedMonthInterval != null && parsedMonthInterval < 0) {
      Alert.alert('Validação', 'Intervalo em meses deve ser maior ou igual a zero.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createReminder(route.params.vehicleId, {
        reminderText: reminderText.trim(),
        mileageIntervalKm: parsedMileageInterval,
        monthInterval: parsedMonthInterval,
      });

      showSuccess('Lembrete salvo com sucesso.');
      navigation.goBack();
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      title="Lembrete"
      subtitle={`${vehicleLabel} • Critérios por data e/ou quilometragem.`}
    >
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Texto do lembrete</Text>
          <TextInput
            style={styles.input}
            value={reminderText}
            onChangeText={setReminderText}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Intervalo em km (opcional)</Text>
          <TextInput
            keyboardType="number-pad"
            style={styles.input}
            value={mileageIntervalKm}
            onChangeText={(value) => setMileageIntervalKm(normalizeIntegerInput(value))}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Intervalo em meses (opcional)</Text>
          <TextInput
            keyboardType="number-pad"
            style={styles.input}
            value={monthInterval}
            onChangeText={(value) => setMonthInterval(normalizeIntegerInput(value))}
          />
        </View>
      </View>

      <Pressable
        style={[styles.button, (isSubmitting || !reminderText.trim() || !hasAnyTrigger) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting || !reminderText.trim() || !hasAnyTrigger}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar lembrete</Text>}
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
