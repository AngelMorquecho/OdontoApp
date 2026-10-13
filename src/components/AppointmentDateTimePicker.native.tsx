import { useEffect, useRef } from 'react';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import {
  Modal,
  Pressable,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { borderRadius, colors, shadows } from '../constants/theme';

interface Props {
  visible: boolean;
  mode: 'date' | 'time';
  value: Date;
  maximumDate?: Date;
  onChange: (value: Date) => void;
  onClose: () => void;
}

export default function AppointmentDateTimePicker({
  visible,
  mode,
  value,
  maximumDate,
  onChange,
  onClose,
}: Props) {
  const currentProps = useRef({ value, maximumDate, onChange, onClose });

  useEffect(() => {
    currentProps.current = { value, maximumDate, onChange, onClose };
  }, [maximumDate, onChange, onClose, value]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;

    DateTimePickerAndroid.open({
      mode,
      value: currentProps.current.value,
      maximumDate: mode === 'date' ? currentProps.current.maximumDate : undefined,
      display: mode === 'date' ? 'calendar' : undefined,
      startOnYearSelection: mode === 'date',
      is24Hour: true,
      onValueChange: (_event, selectedValue) => {
        currentProps.current.onChange(selectedValue);
        currentProps.current.onClose();
      },
      onDismiss: () => currentProps.current.onClose(),
    });
  }, [mode, visible]);

  if (!visible || Platform.OS !== 'ios') return null;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar selector"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View style={styles.tarjeta}>
          <View style={styles.encabezado}>
            <Text style={styles.titulo}>
              {mode === 'date' ? 'Seleccionar fecha' : 'Seleccionar hora'}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.botonListo, pressed && styles.presionado]}
            >
              <Text style={styles.textoListo}>Listo</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={value}
            mode={mode}
            display="spinner"
            locale="es-MX"
            maximumDate={mode === 'date' ? maximumDate : undefined}
            is24Hour
            onValueChange={(_event, selectedValue) => onChange(selectedValue)}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  tarjeta: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  botonListo: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: borderRadius.md,
  },
  textoListo: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  presionado: {
    opacity: 0.7,
  },
});
