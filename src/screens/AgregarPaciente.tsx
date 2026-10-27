import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { borderRadius, colors } from '../constants/theme';
import AppointmentDateTimePicker from '../components/AppointmentDateTimePicker';
import { listarDoctoresPorConsultorio, DoctorOpcion } from '../services/doctores';
import { getSupabaseClient } from '../lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'AgregarPaciente'>;

export default function AgregarPaciente({ navigation }: Props) {
  const { agregarPaciente } = usePacientes();

  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [mostrarSelectorFecha, setMostrarSelectorFecha] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Estados para manejo de multi-doctor
  const [rolUsuario, setRolUsuario] = useState<'DOCTOR' | 'ASISTENTE' | null>(null);
  const [doctores, setDoctores] = useState<DoctorOpcion[]>([]);
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<DoctorOpcion | null>(null);
  const [cargandoDoctores, setCargandoDoctores] = useState<boolean>(true);
  const [mostrarModalDoctor, setMostrarModalDoctor] = useState<boolean>(false);

useEffect(() => {
  async function obtenerRolYDoctores() {
    try {
      const cliente = getSupabaseClient();
      const { data: authData } = await cliente.auth.getUser();

      if (!authData?.user) return;

      const { data: perfil, error: errorPerfil } = await cliente
        .from('perfiles')
        .select('rol, consultorio_id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (errorPerfil || !perfil) return;

      setRolUsuario(perfil.rol as 'DOCTOR' | 'ASISTENTE');

      if (perfil.rol === 'ASISTENTE' && perfil.consultorio_id) {
        const lista = await listarDoctoresPorConsultorio(perfil.consultorio_id);
        setDoctores(lista);
      }
    } catch (error) {
      console.error('Error al obtener rol o doctores:', error);
    } finally {
      setCargandoDoctores(false);
    }
  }

  obtenerRolYDoctores();
}, []);

  const actualizarFechaNacimiento = (fecha: Date) => {
    setFechaNacimiento(fecha);
    const hoy = new Date();
    const edadCalculada =
      hoy.getFullYear() -
      fecha.getFullYear() -
      (hoy.getMonth() < fecha.getMonth() ||
      (hoy.getMonth() === fecha.getMonth() && hoy.getDate() < fecha.getDate())
        ? 1
        : 0);
    setEdad(String(edadCalculada));
  };

  const edadComoNumero = (valor: string) => {
    if (!/^\d+$/.test(valor)) return Number.NaN;
    const numero = Number(valor);
    return Number.isSafeInteger(numero) ? numero : Number.NaN;
  };

  const guardar = async () => {
    const nombreLimpio = nombre.trim();
    const edadIngresada = edadComoNumero(edad);

    if (!nombreLimpio) {
      Alert.alert('Falta información', 'Ingresa el nombre completo del paciente.');
      return;
    }

    if (rolUsuario === 'ASISTENTE' && !doctorSeleccionado) {
      Alert.alert('Falta información', 'Selecciona el doctor asignado a este paciente.');
      return;
    }

    if (!telefono.trim()) {
      Alert.alert('Falta información', 'Ingresa un teléfono de contacto.');
      return;
    }

    if (
      fechaNacimiento &&
      fechaNacimiento > new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
      )
    ) {
      Alert.alert('Fecha no válida', 'La fecha de nacimiento no puede estar en el futuro.');
      return;
    }
    if (
      !fechaNacimiento &&
      (!edad.trim() || Number.isNaN(edadIngresada) || edadIngresada <= 0)
    ) {
      Alert.alert('Falta información', 'Ingresa una edad o fecha de nacimiento válida.');
      return;
    }
    if (correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      Alert.alert('Correo no válido', 'Revisa el formato del correo electrónico.');
      return;
    }

    setGuardando(true);
    try {
      await agregarPaciente({
        nombre: nombreLimpio,
        edad: fechaNacimiento ? Number(edad) : edadIngresada,
        telefono: telefono.trim(),
        ...(fechaNacimiento ? { fechaNacimiento: fechaISO(fechaNacimiento) } : {}),
        ...(correo.trim() ? { correo: correo.trim() } : {}),
        ...(rolUsuario === 'ASISTENTE' && doctorSeleccionado ? { doctorId: doctorSeleccionado.id } : {}),
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo guardar el paciente.',
      );
    } finally {
      setGuardando(false);
    }
  };

  const fechaISO = (fecha: Date) =>
    `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

  const fechaLegible = (fecha: Date) =>
    fecha.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const fechaNacimientoInicial = new Date();
  fechaNacimientoInicial.setFullYear(fechaNacimientoInicial.getFullYear() - 30);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Datos demográficos</Text>

          {/* SELECTOR DE DOCTOR NATIVO (Solo para ASISTENTE) */}
          {rolUsuario === 'ASISTENTE' && (
            <View style={styles.contenedorDoctor}>
              <Text style={styles.etiqueta}>Doctor Asignado *</Text>
              {cargandoDoctores ? (
                <ActivityIndicator color={colors.primary} style={styles.cargandoDoctor} />
              ) : (
                <Pressable
                  onPress={() => setMostrarModalDoctor(true)}
                  style={({ pressed }) => [
                    styles.selectorDoctor,
                    pressed && styles.botonPresionado,
                  ]}
                >
                  <Text
                    style={[
                      styles.textoDoctor,
                      !doctorSeleccionado && styles.placeholderDoctor,
                    ]}
                  >
                    {doctorSeleccionado ? doctorSeleccionado.nombre : 'Selecciona un doctor...'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          )}

          <Text style={styles.etiqueta}>Nombre completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.etiqueta}>Edad (años)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa edad o fecha de nacimiento"
            value={edad}
            onChangeText={(valor) => {
              if (!/^\d*$/.test(valor)) {
                setEdad('');
                setFechaNacimiento(null);
                return;
              }
              setEdad(valor);
              setFechaNacimiento(null);
            }}
            keyboardType="numeric"
          />

          <Text style={styles.etiqueta}>Fecha de nacimiento</Text>
          <View style={styles.filaFecha}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                fechaNacimiento
                  ? `Cambiar fecha de nacimiento. Fecha seleccionada: ${fechaLegible(fechaNacimiento)}`
                  : 'Seleccionar fecha de nacimiento'
              }
              onPress={() => setMostrarSelectorFecha(true)}
              style={({ pressed }) => [
                styles.selectorFecha,
                pressed && styles.botonPresionado,
              ]}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.textoFecha,
                  !fechaNacimiento && styles.placeholderFecha,
                ]}
              >
                {fechaNacimiento
                  ? fechaLegible(fechaNacimiento)
                  : 'Selecciona una fecha'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </Pressable>
            {fechaNacimiento && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quitar fecha de nacimiento"
                hitSlop={8}
                onPress={() => {
                  setFechaNacimiento(null);
                  setEdad('');
                }}
                style={({ pressed }) => [
                  styles.limpiarFecha,
                  pressed && styles.botonPresionado,
                ]}
              >
                <Ionicons name="close-circle" size={21} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
          <Text style={styles.ayuda}>Requerido: edad o fecha de nacimiento.</Text>

          <Text style={styles.etiqueta}>Teléfono *</Text>
          <TextInput
            style={styles.input}
            placeholder="Teléfono de contacto"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />

          <Text style={styles.etiqueta}>Correo (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.boton,
            pressed && styles.botonPresionado,
            guardando && styles.botonDeshabilitado,
          ]}
          onPress={guardar}
          disabled={guardando}
        >
          <Ionicons name="person-add-outline" size={19} color={colors.surface} />
          <Text style={styles.botonTexto}>
            {guardando ? 'Guardando...' : 'Guardar paciente'}
          </Text>
        </Pressable>

        {mostrarSelectorFecha && (
          <AppointmentDateTimePicker
            visible
            mode="date"
            value={fechaNacimiento ?? fechaNacimientoInicial}
            maximumDate={new Date()}
            onChange={actualizarFechaNacimiento}
            onClose={() => setMostrarSelectorFecha(false)}
          />
        )}

        {/* MODAL DESPLEGABLE DE SELECCIÓN DE DOCTOR */}
        <Modal
          visible={mostrarModalDoctor}
          transparent
          animationType="fade"
          onRequestClose={() => setMostrarModalDoctor(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setMostrarModalDoctor(false)}>
            <View style={styles.modalContenido}>
              <Text style={styles.modalTitulo}>Seleccionar Doctor</Text>
              <ScrollView style={styles.modalLista}>
                {doctores.map((doc) => (
                  <Pressable
                    key={doc.id}
                    style={({ pressed }) => [
                      styles.opcionDoctor,
                      doctorSeleccionado?.id === doc.id && styles.opcionDoctorSeleccionada,
                      pressed && styles.botonPresionado,
                    ]}
                    onPress={() => {
                      setDoctorSeleccionado(doc);
                      setMostrarModalDoctor(false);
                    }}
                  >
                    <Ionicons
                      name="medkit-outline"
                      size={18}
                      color={doctorSeleccionado?.id === doc.id ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.textoOpcionDoctor,
                        doctorSeleccionado?.id === doc.id && styles.textoOpcionDoctorSeleccionada,
                      ]}
                    >
                      {doc.nombre}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contenedor: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  tarjeta: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
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
  contenedorDoctor: {
    marginBottom: 4,
  },
  selectorDoctor: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: '#F8FAFC',
  },
  textoDoctor: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  placeholderDoctor: {
    color: colors.textSecondary,
    fontWeight: '400',
  },
  cargandoDoctor: {
    marginVertical: 10,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    minHeight: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: '#F8FAFC',
  },
  filaFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorFecha: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: '#F8FAFC',
  },
  textoFecha: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  placeholderFecha: {
    color: colors.textSecondary,
    fontWeight: '400',
  },
  limpiarFecha: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayuda: { marginTop: 6, color: colors.textSecondary, fontSize: 12 },
  boton: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonPresionado: {
    opacity: 0.7,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonTexto: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContenido: {
    width: '100%',
    maxHeight: '60%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  modalLista: {
    maxHeight: 250,
  },
  opcionDoctor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: borderRadius.md,
    marginBottom: 4,
  },
  opcionDoctorSeleccionada: {
    backgroundColor: colors.primaryLight,
  },
  textoOpcionDoctor: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  textoOpcionDoctorSeleccionada: {
    fontWeight: '700',
    color: colors.primary,
  },
});