import React, { useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import FloatingTabBar, { FloatingTabRoute } from '../components/FloatingTabBar';
import SegmentedControl from '../components/SegmentedControl';
import { usePacientes } from '../context/PacientesContext';
import { EstatusCita } from '../types';
import { borderRadius, colors, shadows } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AgendaCitas'>;

const ESTATUS: {
  valor: EstatusCita;
  etiqueta: string;
  icono: 'calendar-check-outline' | 'calendar-clock-outline' | 'check-circle-outline' | 'calendar-remove-outline';
  color: string;
  fondo: string;
}[] = [
  { valor: 'programada', etiqueta: 'Programadas', icono: 'calendar-check-outline', color: '#0284C7', fondo: '#E0F2FE' },
  { valor: 'pospuesta', etiqueta: 'Pospuestas', icono: 'calendar-clock-outline', color: '#D97706', fondo: '#FEF3C7' },
  { valor: 'completada', etiqueta: 'Completadas', icono: 'check-circle-outline', color: '#15803D', fondo: '#DCFCE7' },
  { valor: 'cancelada', etiqueta: 'Canceladas', icono: 'calendar-remove-outline', color: '#B91C1C', fondo: '#FEE2E2' },
];

const ACCIONES_ESTATUS: { valor: EstatusCita; etiqueta: string }[] = [
  { valor: 'programada', etiqueta: 'Programar' },
  { valor: 'pospuesta', etiqueta: 'Posponer' },
  { valor: 'completada', etiqueta: 'Completar' },
  { valor: 'cancelada', etiqueta: 'Cancelar' },
];

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toLocaleUpperCase('es'))
    .join('');
}

function fechaLegible(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function AgendaCitasScreen({ navigation }: Props) {
  const blurTarget = useRef<View | null>(null);
  const { citas, cambiarEstatusCita, obtenerPaciente, cargandoCitas } = usePacientes();
  const [estatusActivo, setEstatusActivo] = useState<EstatusCita>('programada');
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);

  const citasFiltradas = useMemo(
    () =>
      citas
        .filter((cita) =>
          estatusActivo === 'programada'
            ? cita.estatus === 'programada' || cita.estatus === 'confirmada'
            : cita.estatus === estatusActivo,
        )
        .sort((a, b) => `${a.fecha}T${a.hora}`.localeCompare(`${b.fecha}T${b.hora}`)),
    [citas, estatusActivo],
  );

  const cambiarEstado = async (id: string, nuevoEstatus: EstatusCita) => {
    try {
      await cambiarEstatusCita(id, nuevoEstatus);
      setMenuAbierto(null);
    } catch (error) {
      Alert.alert(
        'No se pudo actualizar la cita',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    }
  };

  const navegar = (ruta: FloatingTabRoute) => {
    switch (ruta) {
      case 'ListaPacientes':
        navigation.navigate('ListaPacientes');
        break;
      case 'AgendaCitas':
        navigation.navigate('AgendaCitas');
        break;
      case 'EducacionPaciente':
        navigation.navigate('EducacionPaciente');
        break;
      case 'Ajustes':
        navigation.navigate('Ajustes');
        break;
    }
  };

  return (
    <View style={styles.pantalla}>
      <BlurTargetView ref={blurTarget} style={styles.contenedor}>
        <View style={styles.filtros}>
          <SegmentedControl
            opciones={ESTATUS}
            valorSeleccionado={estatusActivo}
            onSeleccionar={setEstatusActivo}
          />
        </View>

      <FlatList
        data={citasFiltradas}
        keyExtractor={(cita) => cita.id}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          cargandoCitas ? (
            <View style={styles.vacio}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.detalleVacio}>Cargando agenda…</Text>
            </View>
          ) : (
            <View style={styles.vacio}>
              <Ionicons name="calendar-outline" size={36} color={colors.primary} />
              <Text style={styles.tituloVacio}>Sin citas {estatusActivo === 'programada' ? 'programadas' : ESTATUS.find((item) => item.valor === estatusActivo)?.etiqueta.toLowerCase()}</Text>
              <Text style={styles.detalleVacio}>Las citas de este estado aparecerán aquí.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const estiloBase = ESTATUS.find((estado) =>
            item.estatus === 'confirmada'
              ? estado.valor === 'programada'
              : estado.valor === item.estatus,
          ) ?? ESTATUS[0];
          const estiloEstado = item.estatus === 'confirmada'
            ? { ...estiloBase, etiqueta: 'Confirmada' }
            : estiloBase;
          const pacienteExiste = Boolean(obtenerPaciente(item.pacienteId));
          return (
            <View style={styles.tarjeta}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Abrir ficha de ${item.nombrePaciente}`}
                onPress={() => {
                  if (!pacienteExiste) {
                    Alert.alert('Paciente no disponible', 'No se encontró el expediente asociado a esta cita.');
                    return;
                  }
                  navigation.navigate('DetallePaciente', {
                    pacienteId: item.pacienteId,
                    pestana: 'notas',
                  });
                }}
                style={({ pressed }) => [styles.filaPaciente, pressed && styles.presionado]}
              >
                <View style={[styles.avatar, { backgroundColor: estiloEstado.fondo }]}>
                  <Text style={[styles.textoAvatar, { color: estiloEstado.color }]}>
                    {iniciales(item.nombrePaciente)}
                  </Text>
                </View>
                <View style={styles.infoPaciente}>
                  <Text numberOfLines={1} style={styles.nombrePaciente}>{item.nombrePaciente}</Text>
                  <Text numberOfLines={1} style={styles.fecha}>
                    {fechaLegible(item.fecha)} · {item.hora}
                  </Text>
                </View>
                <View style={[styles.badgeEstado, { backgroundColor: estiloEstado.fondo }]}>
                  <Text style={[styles.textoEstado, { color: estiloEstado.color }]}>
                    {estiloEstado.etiqueta}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.separador} />
              <Text style={styles.etiqueta}>Motivo de consulta</Text>
              <Text style={styles.contenido}>{item.motivoConsulta}</Text>
              <Text style={styles.etiqueta}>Tratamiento previsto</Text>
              <Text style={styles.contenido}>{item.tratamientoPrevisto}</Text>
              {item.notasAgenda ? (
                <>
                  <Text style={styles.etiqueta}>Notas</Text>
                  <Text style={styles.contenido}>{item.notasAgenda}</Text>
                </>
              ) : null}

              <View style={styles.filaAcciones}>
                <Pressable
                  accessibilityRole="button"
                  disabled={!pacienteExiste}
                  onPress={() =>
                    navigation.navigate('DetallePaciente', {
                      pacienteId: item.pacienteId,
                      pestana: 'notas',
                    })
                  }
                  style={({ pressed }) => [
                    styles.botonConsulta,
                    pressed && styles.presionado,
                    !pacienteExiste && styles.deshabilitado,
                  ]}
                >
                  <Text style={styles.textoConsulta}>Iniciar consulta</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: menuAbierto === item.id }}
                  onPress={() => setMenuAbierto((abierto) => (abierto === item.id ? null : item.id))}
                  style={({ pressed }) => [styles.botonEstado, pressed && styles.presionado]}
                >
                  <Text style={styles.textoCambiar}>Cambiar estado</Text>
                </Pressable>
              </View>

              {menuAbierto === item.id && (
                <View style={styles.menuEstados}>
                  {ACCIONES_ESTATUS.filter((opcion) => opcion.valor !== item.estatus).map((opcion) => (
                    <Pressable
                      key={opcion.valor}
                      accessibilityRole="button"
                      onPress={() => void cambiarEstado(item.id, opcion.valor)}
                      style={({ pressed }) => [
                        styles.opcionEstado,
                        {
                          backgroundColor:
                            ESTATUS.find((estado) => estado.valor === opcion.valor)?.fondo ??
                            colors.primaryLight,
                          borderColor:
                            ESTATUS.find((estado) => estado.valor === opcion.valor)?.color ??
                            colors.primary,
                        },
                        pressed && styles.presionado,
                      ]}
                    >
                      <Text
                        style={[
                          styles.textoOpcionEstado,
                          {
                            color:
                              ESTATUS.find((estado) => estado.valor === opcion.valor)?.color ??
                              colors.primary,
                          },
                        ]}
                      >
                        {opcion.etiqueta}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('AgendarCita', undefined)}
        style={({ pressed }) => [styles.botonFlotante, pressed && styles.presionado]}
      >
        <Ionicons name="add" size={29} color={colors.surface} />
      </Pressable>
      </BlurTargetView>
      <FloatingTabBar
        rutaActiva="AgendaCitas"
        onNavegar={navegar}
        blurTarget={blurTarget}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  contenedor: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 12,
    paddingBottom: 100,
    backgroundColor: colors.background,
  },
  filtros: { marginTop: 16, marginBottom: 12 },
  lista: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  tarjeta: {
    marginBottom: 12,
    padding: 14,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  filaPaciente: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  avatar: {
    width: 44,
    height: 44,
    marginRight: 10,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoAvatar: { fontSize: 14, fontWeight: '700' },
  infoPaciente: { flex: 1, minWidth: 0 },
  nombrePaciente: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  fecha: { marginTop: 3, color: colors.textSecondary, fontSize: 12 },
  badgeEstado: { marginLeft: 8, paddingHorizontal: 9, paddingVertical: 5, borderRadius: borderRadius.full },
  textoEstado: { fontSize: 10, fontWeight: '700' },
  separador: { height: 1, marginVertical: 12, backgroundColor: colors.border },
  etiqueta: { marginTop: 8, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  contenido: { marginTop: 3, color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  filaAcciones: { flexDirection: 'row', gap: 8, marginTop: 16 },
  botonConsulta: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  textoConsulta: { color: colors.surface, fontSize: 13, fontWeight: '700' },
  botonEstado: {
    minHeight: 40,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  textoCambiar: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  menuEstados: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  opcionEstado: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: borderRadius.full,
  },
  textoOpcionEstado: { fontSize: 12, fontWeight: '600' },
  vacio: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 24,
    paddingHorizontal: 24,
  },
  iconoVacio: { fontSize: 36 },
  tituloVacio: { marginTop: 12, color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  detalleVacio: { marginTop: 6, color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
  botonFlotante: {
    position: 'absolute',
    right: 20,
    bottom: 104,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  presionado: { opacity: 0.7 },
  deshabilitado: { opacity: 0.5 },
});
