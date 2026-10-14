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
import { usePacientes } from '../context/PacientesContext';
import { borderRadius, colors, shadows } from '../constants/theme';
import type { EstadoPlanTratamiento } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'NuevoTratamiento'>;
type EstadoOpcion = { valor: EstadoPlanTratamiento; etiqueta: string };
const ESTADOS: EstadoOpcion[] = [
  { valor: 'en_proceso', etiqueta: 'En Proceso' },
  { valor: 'completado', etiqueta: 'Completado' },
];

function parsearMonto(valor: string): number | null {
  const normalizado = valor.replace(',', '.').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null;
  const monto = Number(normalizado);
  return Number.isFinite(monto) && monto > 0 ? monto : null;
}

export default function NuevoTratamientoModal({ route, navigation }: Props) {
  const { pacienteId } = route.params;
  const { obtenerPaciente, crearTratamiento } = usePacientes();
  const paciente = obtenerPaciente(pacienteId);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [costo, setCosto] = useState('');
  const [estado, setEstado] = useState<EstadoPlanTratamiento>('en_proceso');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const costoTotal = parsearMonto(costo);
    if (!nombre.trim() || !costoTotal) {
      Alert.alert('Faltan datos', 'Ingresa el nombre del tratamiento y un costo válido mayor que cero.');
      return;
    }
    setGuardando(true);
    try {
      await crearTratamiento({
        pacienteId,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        costoTotal: Math.round(costoTotal * 100) / 100,
        estado,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'No se pudo guardar el tratamiento',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setGuardando(false);
    }
  };

  if (!paciente) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.textoAyuda}>No se encontró el paciente de este tratamiento.</Text>
      </View>
    );
  }

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
          <Text style={styles.textoAyuda}>Registra el plan clínico y su costo acordado.</Text>
        </View>
        <View style={styles.tarjeta}>
          <Campo
            label="Nombre del tratamiento *"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej. Rehabilitación con corona"
          />
          <Campo
            label="Descripción / Notas clínicas"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Detalles clínicos y notas"
            multiline
          />
          <Campo
            label="Costo Total ($) *"
            value={costo}
            onChangeText={(valor) => setCosto(valor.replace(/[^\d.,]/g, ''))}
            placeholder="0.00"
            keyboardType="numeric"
          />
          <Text style={styles.label}>Estado</Text>
          <View style={styles.filaOpciones}>
            {ESTADOS.map((opcion) => (
              <Pressable
                key={opcion.valor}
                accessibilityRole="button"
                accessibilityState={{ selected: estado === opcion.valor }}
                onPress={() => setEstado(opcion.valor)}
                style={({ pressed }) => [
                  styles.opcion,
                  estado === opcion.valor && styles.opcionActiva,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={[
                  styles.textoOpcion,
                  estado === opcion.valor && styles.textoOpcionActivo,
                ]}>
                  {opcion.etiqueta}
                </Text>
              </Pressable>
            ))}
          </View>
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
          <Ionicons name="save-outline" size={19} color={colors.surface} />
          <Text style={styles.textoBotonGuardar}>
            {guardando ? 'Guardando…' : 'Guardar tratamiento'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Campo({
  label,
  multiline = false,
  keyboardType = 'default',
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={[styles.input, multiline && styles.textoMultilinea]}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  contenido: { padding: 16, paddingBottom: 32 },
  encabezado: { marginBottom: 14 },
  nombrePaciente: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  textoAyuda: { marginTop: 5, color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
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
  textoMultilinea: { minHeight: 96, paddingTop: 12 },
  filaOpciones: { flexDirection: 'row', gap: 10 },
  opcion: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  opcionActiva: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  textoOpcion: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  textoOpcionActivo: { color: colors.primary },
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
