import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import AppointmentDateTimePicker from '../components/AppointmentDateTimePicker';
import { usePacientes } from '../context/PacientesContext';
import { borderRadius, colors, shadows } from '../constants/theme';
import type { MetodoPago } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistrarAbono'>;

const METODOS: { valor: MetodoPago; etiqueta: string; icono: keyof typeof Ionicons.glyphMap }[] = [
  { valor: 'efectivo', etiqueta: 'Efectivo', icono: 'cash-outline' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta', icono: 'card-outline' },
  { valor: 'transferencia', etiqueta: 'Transferencia', icono: 'swap-horizontal-outline' },
];

function fechaISO(fecha: Date): string {
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, '0'),
    String(fecha.getDate()).padStart(2, '0'),
  ].join('-');
}

function parsearMonto(valor: string): number | null {
  const normalizado = valor.replace(',', '.').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null;
  const monto = Number(normalizado);
  return Number.isFinite(monto) && monto > 0 ? monto : null;
}

export default function RegistrarAbonoModal({ route, navigation }: Props) {
  const { pacienteId, tratamientoId } = route.params;
  const { obtenerPaciente, getTratamientosPaciente, registrarAbono } = usePacientes();
  const paciente = obtenerPaciente(pacienteId);
  const tratamiento = getTratamientosPaciente(pacienteId).find(
    (item) => item.id === tratamientoId,
  );
  const [montoTexto, setMontoTexto] = useState('');
  const [fecha, setFecha] = useState(() => new Date());
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [concepto, setConcepto] = useState('');
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [guardando, setGuardando] = useState(false);

  if (!paciente || !tratamiento) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.textoAyuda}>No se encontró el paciente o tratamiento.</Text>
      </View>
    );
  }

  const totalPagado = tratamiento.abonos.reduce((total, abono) => total + abono.monto, 0);
  const saldoPendiente = Math.max(0, tratamiento.costoTotal - totalPagado);

  const guardar = async () => {
    const monto = parsearMonto(montoTexto);
    if (!monto) {
      Alert.alert('Monto no válido', 'Ingresa un monto mayor que cero con hasta dos decimales.');
      return;
    }
    setGuardando(true);
    try {
      await registrarAbono(tratamientoId, {
        monto: Math.round(monto * 100) / 100,
        fecha: fechaISO(fecha),
        metodoPago,
        concepto: concepto.trim(),
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'No se pudo registrar el abono',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.encabezado}>
          <Text style={styles.nombrePaciente}>{paciente.nombre}</Text>
          <Text style={styles.textoAyuda}>{tratamiento.nombre}</Text>
        </View>
        <View style={styles.tarjetaSaldo}>
          <Text style={styles.etiquetaSaldo}>Saldo pendiente</Text>
          <Text style={styles.montoSaldo}>
            {saldoPendiente.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
          </Text>
        </View>
        <View style={styles.tarjeta}>
          <Text style={styles.label}>Monto del abono ($) *</Text>
          <TextInput
            style={styles.input}
            value={montoTexto}
            onChangeText={(valor) => setMontoTexto(valor.replace(/[^\d.,]/g, ''))}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Fecha del pago *</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Fecha del pago: ${fecha.toLocaleDateString('es-MX')}`}
            onPress={() => setMostrarFecha(true)}
            style={({ pressed }) => [styles.selectorFecha, pressed && styles.presionado]}
          >
            <Ionicons name="calendar-outline" size={19} color={colors.primary} />
            <Text style={styles.textoFecha}>
              {fecha.toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Ionicons name="chevron-down" size={17} color={colors.textSecondary} />
          </Pressable>

          <Text style={styles.label}>Método de pago</Text>
          <View style={styles.listaMetodos}>
            {METODOS.map((metodo) => (
              <Pressable
                key={metodo.valor}
                accessibilityRole="button"
                accessibilityState={{ selected: metodoPago === metodo.valor }}
                onPress={() => setMetodoPago(metodo.valor)}
                style={({ pressed }) => [
                  styles.opcionMetodo,
                  metodoPago === metodo.valor && styles.opcionMetodoActiva,
                  pressed && styles.presionado,
                ]}
              >
                <Ionicons
                  name={metodo.icono}
                  size={18}
                  color={metodoPago === metodo.valor ? colors.primary : colors.textSecondary}
                />
                <Text style={[
                  styles.textoMetodo,
                  metodoPago === metodo.valor && styles.textoMetodoActivo,
                ]}>
                  {metodo.etiqueta}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Nota / Concepto (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultilinea]}
            value={concepto}
            onChangeText={setConcepto}
            placeholder="Descripción del pago"
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={guardando}
          onPress={() => void guardar()}
          style={({ pressed }) => [
            styles.botonGuardar,
            pressed && !guardando && styles.presionado,
            guardando && styles.deshabilitado,
          ]}
        >
          <Ionicons name="wallet-outline" size={19} color={colors.surface} />
          <Text style={styles.textoBotonGuardar}>
            {guardando ? 'Guardando…' : 'Registrar abono'}
          </Text>
        </Pressable>
      </ScrollView>
      {mostrarFecha && (
        <AppointmentDateTimePicker
          visible
          mode="date"
          value={fecha}
          maximumDate={new Date()}
          onChange={setFecha}
          onClose={() => setMostrarFecha(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  contenido: { padding: 16, paddingBottom: 32 },
  encabezado: { marginBottom: 14 },
  nombrePaciente: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  textoAyuda: { marginTop: 5, color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  tarjetaSaldo: {
    padding: 16,
    marginBottom: 12,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
  },
  etiquetaSaldo: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  montoSaldo: { marginTop: 5, color: colors.primary, fontSize: 22, fontWeight: '800' },
  tarjeta: {
    padding: 16,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  label: { marginTop: 13, marginBottom: 6, color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    fontSize: 14,
  },
  selectorFecha: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  textoFecha: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  listaMetodos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcionMetodo: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  opcionMetodoActiva: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  textoMetodo: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  textoMetodoActivo: { color: colors.primary },
  inputMultilinea: { minHeight: 80, paddingTop: 12 },
  botonGuardar: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  textoBotonGuardar: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  presionado: { opacity: 0.7 },
  deshabilitado: { opacity: 0.55 },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
