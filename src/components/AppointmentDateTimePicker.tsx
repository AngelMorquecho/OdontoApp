import DateTimePicker from '@react-native-community/datetimepicker';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors } from '../constants/theme';

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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.fondo}>
        <View style={styles.tarjeta}>
          <Text style={styles.titulo}>
            {mode === 'date' ? 'Seleccionar fecha' : 'Seleccionar hora'}
          </Text>
          <DateTimePicker
            value={value}
            mode={mode}
            is24Hour
            maximumDate={mode === 'date' ? maximumDate : undefined}
            onValueChange={(_event, selectedValue) => onChange(selectedValue)}
          />
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
          >
            <Text style={styles.textoBoton}>Listo</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  tarjeta: {
    alignItems: 'center',
    padding: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.surface,
  },
  titulo: {
    marginBottom: 8,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  boton: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
  },
  textoBoton: {
    color: colors.primary,
    fontWeight: '700',
  },
  presionado: {
    opacity: 0.7,
  },
});
