import React, { useCallback, useMemo, useState } from 'react';
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
import { Cita } from '../types';
import { borderRadius, colors, shadows } from '../constants/theme';
import AppointmentDateTimePicker from '../components/AppointmentDateTimePicker';

type Props = NativeStackScreenProps<RootStackParamList, 'AgendarCita'>;

type ModoSelector = 'date' | 'time';

function fechaISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function fechaLegible(fecha: Date): string {
  return fecha.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function hora24(hora: Date): string {
  return `${String(hora.getHours()).padStart(2, '0')}:${String(hora.getMinutes()).padStart(2, '0')}`;
}

export default function AgendarCitaScreen({ navigation, route }: Props) {
  const { pacientes, crearCita, cargandoCitas } = usePacientes();
  const [pacienteId, setPacienteId] = useState(route.params?.pacienteId ?? '');
  const [mostrarPacientes, setMostrarPacientes] = useState(false);
  const [fecha, setFecha] = useState(() => new Date());
  const [hora, setHora] = useState(() => new Date());
  const [selectorActivo, setSelectorActivo] = useState<ModoSelector | null>(null);
  const paciente = useMemo(
    () => pacientes.find((item) => item.id === pacienteId),
    [pacienteId, pacientes],
  );
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [tratamientoPrevisto, setTratamientoPrevisto] = useState('');
  const [notasAgenda, setNotasAgenda] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiarFechaHora = useCallback(
    (valor: Date) => {
      if (selectorActivo === 'date') setFecha(valor);
      if (selectorActivo === 'time') setHora(valor);
    },
    [selectorActivo],
  );

  const guardar = async () => {
    if (!paciente) {
      Alert.alert('Falta información', 'Selecciona al paciente de esta cita.');
      return;
    }
    if (!motivoConsulta.trim()) {
      Alert.alert('Falta información', 'Ingresa el motivo de consulta.');
      return;
    }
    if (!tratamientoPrevisto.trim()) {
      Alert.alert('Falta información', 'Ingresa el tratamiento previsto.');
      return;
    }

    const nuevaCita: Cita = {
      id: `cita-${Date.now()}`,
      pacienteId: paciente.id,
      nombrePaciente: paciente.nombre,
      fecha: fechaISO(fecha),
      hora: hora24(hora),
      motivoConsulta: motivoConsulta.trim(),
      tratamientoPrevisto: tratamientoPrevisto.trim(),
      estatus: 'programada',
      ...(notasAgenda.trim() ? { notasAgenda: notasAgenda.trim() } : {}),
    };

    setGuardando(true);
    try {
      await crearCita(nuevaCita);
      Alert.alert('Cita agendada', `La cita para ${paciente.nombre} quedó programada.`, [
        { text: 'Ver agenda', onPress: () => navigation.navigate('AgendaCitas') },
        { text: 'Cerrar', style: 'cancel', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(
        'No se pudo agendar la cita',
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
        contentContainerStyle={styles.contenedor}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.introduccion}>
          Registra la información para organizar y preparar la consulta.
        </Text>

        <View style={styles.tarjetaFormulario}>
          <Text style={styles.tituloSeccion}>Datos de la Consulta</Text>
          <Text style={styles.etiqueta}>Paciente *</Text>
          {route.params?.pacienteId ? (
            <View style={styles.pacienteSeleccionado}>
              <Text style={styles.nombrePaciente}>
                {paciente?.nombre ?? 'Paciente no encontrado'}
              </Text>
            </View>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => setMostrarPacientes((visible) => !visible)}
                style={({ pressed }) => [styles.selectorPaciente, pressed && styles.presionado]}
              >
                <Text style={paciente ? styles.valorSelector : styles.placeholder}>
                  {paciente?.nombre ?? 'Selecciona un paciente'}
                </Text>
                <Ionicons
                  name={mostrarPacientes ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
              {mostrarPacientes && (
                <View style={styles.listaPacientes}>
                  {pacientes.map((opcion) => (
                    <Pressable
                      key={opcion.id}
                      accessibilityRole="button"
                      onPress={() => {
                        setPacienteId(opcion.id);
                        setMostrarPacientes(false);
                      }}
                      style={({ pressed }) => [styles.opcionPaciente, pressed && styles.presionado]}
                    >
                      <Text style={styles.valorSelector}>{opcion.nombre}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}

          <Text style={styles.etiqueta}>Fecha *</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Seleccionar fecha. Fecha actual: ${fechaLegible(fecha)}`}
            onPress={() => setSelectorActivo('date')}
            style={({ pressed }) => [styles.selectorFechaHora, pressed && styles.presionado]}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.valorFechaHora}>{fechaLegible(fecha)}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </Pressable>

          <Text style={styles.etiqueta}>Hora * (24 horas)</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Seleccionar hora. Hora actual: ${hora24(hora)}`}
            onPress={() => setSelectorActivo('time')}
            style={({ pressed }) => [styles.selectorFechaHora, pressed && styles.presionado]}
          >
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.valorFechaHora}>{hora24(hora)}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.tarjetaFormulario}>
          <Text style={styles.tituloSeccion}>Detalles Clínicos</Text>
          <Text style={styles.etiqueta}>Motivo de consulta *</Text>
          <TextInput
            style={[styles.input, styles.multilinea]}
            value={motivoConsulta}
            onChangeText={setMotivoConsulta}
            placeholder="Describe el motivo de la consulta"
            placeholderTextColor={colors.textSecondary}
            multiline
          />

          <Text style={styles.etiqueta}>Tratamiento previsto *</Text>
          <TextInput
            style={[styles.input, styles.multilinea]}
            value={tratamientoPrevisto}
            onChangeText={setTratamientoPrevisto}
            placeholder="Indica el tratamiento planeado"
            placeholderTextColor={colors.textSecondary}
            multiline
          />

          <Text style={styles.etiqueta}>Notas de agenda (opcional)</Text>
          <TextInput
            style={[styles.input, styles.multilinea]}
            value={notasAgenda}
            onChangeText={setNotasAgenda}
            placeholder="Indicaciones adicionales"
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={guardando || cargandoCitas}
          onPress={() => void guardar()}
          style={({ pressed }) => [
            styles.botonGuardar,
            pressed && styles.presionado,
            (guardando || cargandoCitas) && styles.deshabilitado,
          ]}
        >
          <Text style={styles.textoBoton}>
            {cargandoCitas ? 'Cargando agenda…' : guardando ? 'Guardando…' : 'Agendar Cita'}
          </Text>
        </Pressable>
      </ScrollView>
      {selectorActivo && (
        <AppointmentDateTimePicker
          visible
          mode={selectorActivo}
          value={selectorActivo === 'time' ? hora : fecha}
          onChange={cambiarFechaHora}
          onClose={() => setSelectorActivo(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contenedor: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  introduccion: {
    marginBottom: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },
  tarjetaFormulario: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tituloSeccion: {
    marginBottom: 4,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  etiqueta: {
    marginTop: 14,
    marginBottom: 6,
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    color: colors.textPrimary,
    fontSize: 15,
  },
  selectorFechaHora: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  valorFechaHora: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  textoPlaceholder: {
    color: colors.textSecondary,
    fontWeight: '400',
  },
  multilinea: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  selectorPaciente: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pacienteSeleccionado: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
  },
  nombrePaciente: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  valorSelector: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  placeholder: { color: colors.textSecondary, fontSize: 14 },
  listaPacientes: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  opcionPaciente: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detallePaciente: { marginTop: 3, color: colors.textSecondary, fontSize: 12 },
  botonGuardar: {
    width: '100%',
    paddingVertical: 14,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#0284C7',
    ...shadows.sm,
  },
  textoBoton: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  presionado: { opacity: 0.7 },
  deshabilitado: { opacity: 0.6 },
});
