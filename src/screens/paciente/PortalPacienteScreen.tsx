import React, { useMemo, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import FloatingTabBar, { FloatingTabRoute } from '../../components/FloatingTabBar';
import { borderRadius, colors, shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useConsultorio } from '../../context/ConsultorioContext';
import { usePacientes } from '../../context/PacientesContext';
import { RootStackParamList } from '../../navigation/types';
import { Cita, Receta } from '../../types';
import {
  compartirPdfReceta,
  generarPdfReceta,
} from '../../services/pdfRecetaService';

type Props = NativeStackScreenProps<RootStackParamList, 'PortalPaciente'>;
type SeccionPortal = 'citas' | 'tratamiento';

function fechaHoy(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
}

function fechaLegible(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  if (!anio || !mes || !dia) return fecha;
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PortalPacienteScreen({ route, navigation }: Props) {
  const blurTarget = useRef<View | null>(null);
  const { user, logout } = useAuth();
  const {
    citas,
    cargandoCitas,
    cargandoRecetas,
    cambiarEstatusCita,
    obtenerPaciente,
    getRecetasPaciente,
  } = usePacientes();
  const { consultorio } = useConsultorio();
  const [seccionLocal, setSeccionLocal] = useState<SeccionPortal>(
    route.params?.seccion ?? 'citas',
  );
  const seccion = route.params?.seccion ?? seccionLocal;
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);
  const pacienteId = user?.pacienteId;
  const paciente = pacienteId ? obtenerPaciente(pacienteId) : undefined;

  const citasProximas = useMemo(
    () =>
      citas
        .filter(
          (cita) =>
            cita.pacienteId === pacienteId &&
            cita.fecha >= fechaHoy() &&
            (cita.estatus === 'programada' || cita.estatus === 'confirmada'),
        )
        .sort((a, b) => `${a.fecha}T${a.hora}`.localeCompare(`${b.fecha}T${b.hora}`)),
    [citas, pacienteId],
  );
  const recetasPaciente = pacienteId ? getRecetasPaciente(pacienteId) : [];
  const tratamientosActivos = recetasPaciente.filter(
    (receta) => receta.estadoTratamiento === 'activo',
  );

  const navegar = (ruta: FloatingTabRoute) => {
    if (ruta === 'Ajustes') {
      navigation.navigate('Ajustes');
      return;
    }
    if (ruta === 'EducacionPaciente') {
      navigation.navigate('EducacionPaciente');
      return;
    }
    setSeccionLocal('citas');
    navigation.setParams({ seccion: 'citas' });
  };

  const seleccionarSeccion = (siguienteSeccion: SeccionPortal) => {
    setSeccionLocal(siguienteSeccion);
    navigation.setParams({ seccion: siguienteSeccion });
  };

  const confirmarCita = async (cita: Cita) => {
    setAccionEnCurso(`cita-${cita.id}`);
    try {
      await cambiarEstatusCita(cita.id, 'confirmada');
    } catch (error) {
      Alert.alert(
        'No se pudo confirmar la asistencia',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setAccionEnCurso(null);
    }
  };

  const verPdf = async (receta: Receta) => {
    if (!paciente) return;
    setAccionEnCurso(`pdf-${receta.id}`);
    try {
      const uri = await generarPdfReceta(receta, paciente, consultorio);
      await compartirPdfReceta(uri);
    } catch (error) {
      Alert.alert(
        'No se pudo abrir el PDF',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setAccionEnCurso(null);
    }
  };

  return (
    <View style={styles.pantalla}>
      <BlurTargetView ref={blurTarget} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.encabezado}>
            <View style={styles.filaSaludo}>
              <Text style={styles.saludo}>Hola, {user?.nombre ?? 'Paciente'}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar sesión"
                hitSlop={8}
                onPress={() => void logout()}
                style={({ pressed }) => [
                  styles.botonLogout,
                  pressed && styles.presionado,
                ]}
              >
                <Ionicons name="log-out-outline" size={21} color={colors.danger} />
              </Pressable>
            </View>
            <Text style={styles.subtitulo}>
              {seccion === 'citas'
                ? 'Consulta tus próximas citas.'
                : 'Revisa tus tratamientos e indicaciones.'}
            </Text>
          </View>
          <View style={styles.selectorSeccion}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: seccion === 'citas' }}
              onPress={() => seleccionarSeccion('citas')}
              style={[
                styles.opcionSeccion,
                seccion === 'citas' && styles.opcionSeccionActiva,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={17}
                color={seccion === 'citas' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.textoOpcionSeccion,
                  seccion === 'citas' && styles.textoOpcionSeccionActiva,
                ]}
              >
                Mis citas
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: seccion === 'tratamiento' }}
              onPress={() => seleccionarSeccion('tratamiento')}
              style={[
                styles.opcionSeccion,
                seccion === 'tratamiento' && styles.opcionSeccionActiva,
              ]}
            >
              <MaterialCommunityIcons
                name="pill"
                size={18}
                color={seccion === 'tratamiento' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.textoOpcionSeccion,
                  seccion === 'tratamiento' && styles.textoOpcionSeccionActiva,
                ]}
              >
                Tratamiento
              </Text>
            </Pressable>
          </View>

          {!paciente ? (
            <View style={styles.tarjetaVacia}>
              <MaterialCommunityIcons
                name="account-alert-outline"
                size={30}
                color={colors.textSecondary}
              />
              <Text style={styles.tituloVacio}>Perfil de paciente no disponible</Text>
              <Text style={styles.textoVacio}>
                Vuelve a Ajustes y selecciona un paciente para la vista de prueba.
              </Text>
            </View>
          ) : seccion === 'citas' ? (
            <SeccionCitas
              citas={citasProximas}
              cargando={cargandoCitas}
              accionEnCurso={accionEnCurso}
              onConfirmar={confirmarCita}
            />
          ) : (
            <SeccionTratamiento
              recetas={recetasPaciente}
              recetasActivas={tratamientosActivos}
              cargando={cargandoRecetas}
              accionEnCurso={accionEnCurso}
              onVerPdf={verPdf}
            />
          )}
        </ScrollView>
      </BlurTargetView>
      <FloatingTabBar
        rutaActiva="AgendaCitas"
        onNavegar={navegar}
        blurTarget={blurTarget}
        modoPaciente
      />
    </View>
  );
}

interface SeccionCitasProps {
  citas: Cita[];
  cargando: boolean;
  accionEnCurso: string | null;
  onConfirmar: (cita: Cita) => void;
}

function SeccionCitas({
  citas,
  cargando,
  accionEnCurso,
  onConfirmar,
}: SeccionCitasProps) {
  if (cargando) {
    return <ActivityIndicator color={colors.primary} style={styles.cargando} />;
  }
  if (citas.length === 0) {
    return (
      <View style={styles.tarjetaVacia}>
        <Ionicons name="calendar-outline" size={30} color={colors.primary} />
        <Text style={styles.tituloVacio}>No tienes próximas citas</Text>
        <Text style={styles.textoVacio}>
          Tus citas programadas aparecerán aquí.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.tituloSeccionFila}>
        <Ionicons name="calendar" size={20} color={colors.primary} />
        <Text style={styles.tituloSeccion}>Próximas citas</Text>
      </View>
      {citas.map((cita) => (
        <View key={cita.id} style={styles.tarjeta}>
          <View style={styles.filaFecha}>
            <View style={styles.iconoFecha}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.fechaCita}>{fechaLegible(cita.fecha)}</Text>
              <Text style={styles.horaCita}>{cita.hora}</Text>
            </View>
            <View
              style={[
                styles.badgeCita,
                cita.estatus === 'confirmada' && styles.badgeConfirmada,
              ]}
            >
              <Text
                style={[
                  styles.textoBadgeCita,
                  cita.estatus === 'confirmada' && styles.textoConfirmada,
                ]}
              >
                {cita.estatus === 'confirmada' ? 'Confirmada' : 'Programada'}
              </Text>
            </View>
          </View>
          <Text style={styles.etiqueta}>Motivo de consulta</Text>
          <Text style={styles.textoPrincipal}>{cita.motivoConsulta}</Text>
          {cita.tratamientoPrevisto ? (
            <>
              <Text style={styles.etiqueta}>Tratamiento previsto</Text>
              <Text style={styles.textoSecundario}>{cita.tratamientoPrevisto}</Text>
            </>
          ) : null}
          {cita.estatus === 'programada' ? (
            <Pressable
              accessibilityRole="button"
              disabled={accionEnCurso !== null}
              onPress={() => onConfirmar(cita)}
              style={({ pressed }) => [
                styles.botonPrimario,
                pressed && styles.presionado,
                accionEnCurso === `cita-${cita.id}` && styles.deshabilitado,
              ]}
            >
              {accionEnCurso === `cita-${cita.id}` ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={19} color={colors.surface} />
              )}
              <Text style={styles.textoBotonPrimario}>Confirmar Asistencia</Text>
            </Pressable>
          ) : (
            <View style={styles.confirmacion}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.textoConfirmacion}>Asistencia confirmada</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

interface SeccionTratamientoProps {
  recetas: Receta[];
  recetasActivas: Receta[];
  cargando: boolean;
  accionEnCurso: string | null;
  onVerPdf: (receta: Receta) => void;
}

function SeccionTratamiento({
  recetas,
  recetasActivas,
  cargando,
  accionEnCurso,
  onVerPdf,
}: SeccionTratamientoProps) {
  if (cargando) {
    return <ActivityIndicator color={colors.primary} style={styles.cargando} />;
  }

  return (
    <View>
      <View style={styles.tituloSeccionFila}>
        <MaterialCommunityIcons name="pill" size={21} color={colors.primary} />
        <Text style={styles.tituloSeccion}>Mi Tratamiento Activo</Text>
      </View>
      {recetasActivas.length === 0 ? (
        <View style={styles.tarjetaVacia}>
          <MaterialCommunityIcons
            name="clipboard-text-outline"
            size={30}
            color={colors.textSecondary}
          />
          <Text style={styles.tituloVacio}>No tienes tratamientos activos</Text>
          <Text style={styles.textoVacio}>
            Las indicaciones de tus recetas activas aparecerán aquí.
          </Text>
        </View>
      ) : (
        recetasActivas.map((receta) => (
          <View key={receta.id} style={styles.tarjeta}>
            <View style={styles.filaFecha}>
              <View style={styles.flex}>
                <Text style={styles.fechaCita}>{receta.diagnostico}</Text>
                <Text style={styles.horaCita}>
                  Emitida el {fechaLegible(receta.fechaEmision)}
                </Text>
              </View>
              <View style={[styles.badgeCita, styles.badgeConfirmada]}>
                <Text style={[styles.textoBadgeCita, styles.textoConfirmada]}>Activo</Text>
              </View>
            </View>
            {receta.medicamentos.map((medicamento) => (
              <View key={medicamento.id} style={styles.filaMedicamento}>
                <MaterialCommunityIcons name="pill" size={18} color={colors.primary} />
                <View style={styles.flex}>
                  <Text style={styles.nombreMedicamento}>{medicamento.nombre}</Text>
                  <Text style={styles.textoSecundario}>
                    {medicamento.dosis} · {medicamento.frecuencia} · {medicamento.duracion}
                  </Text>
                  {medicamento.indicaciones ? (
                    <Text style={styles.textoSecundario}>{medicamento.indicaciones}</Text>
                  ) : null}
                </View>
              </View>
            ))}
            {receta.indicacionesGenerales
              .split(/\n+/)
              .filter(Boolean)
              .map((indicacion, indice) => (
                <View key={`${receta.id}-${indice}`} style={styles.filaIndicacion}>
                  <MaterialCommunityIcons
                    name="checkbox-marked-circle-outline"
                    size={18}
                    color={colors.success}
                  />
                  <Text style={styles.textoPrincipal}>{indicacion}</Text>
                </View>
              ))}
          </View>
        ))
      )}

      <View style={[styles.tituloSeccionFila, styles.seccionHistorial]}>
        <MaterialCommunityIcons name="history" size={21} color={colors.primary} />
        <Text style={styles.tituloSeccion}>Mis Recetas (PDF)</Text>
      </View>
      {recetas.length === 0 ? (
        <Text style={styles.sinHistorial}>Todavía no hay recetas emitidas.</Text>
      ) : (
        recetas.map((receta) => (
          <View key={receta.id} style={styles.tarjetaHistorial}>
            <View style={styles.flex}>
              <Text style={styles.nombreMedicamento}>{fechaLegible(receta.fechaEmision)}</Text>
              <Text style={styles.textoSecundario} numberOfLines={2}>
                {receta.diagnostico}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={accionEnCurso !== null}
              onPress={() => onVerPdf(receta)}
              style={({ pressed }) => [
                styles.botonPdf,
                pressed && styles.presionado,
                accionEnCurso === `pdf-${receta.id}` && styles.deshabilitado,
              ]}
            >
              {accionEnCurso === `pdf-${receta.id}` ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <MaterialCommunityIcons
                  name="file-download-outline"
                  size={18}
                  color={colors.primary}
                />
              )}
              <Text style={styles.textoBotonPdf}>Ver PDF / Descargar</Text>
            </Pressable>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  contenido: {
    padding: 16,
    paddingBottom: 110,
  },
  encabezado: {
    marginBottom: 20,
  },
  selectorSeccion: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
    padding: 4,
    borderRadius: borderRadius.md,
    backgroundColor: '#E2E8F0',
  },
  opcionSeccion: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
  },
  opcionSeccionActiva: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  textoOpcionSeccion: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  textoOpcionSeccionActiva: {
    color: colors.primary,
    fontWeight: '700',
  },
  filaSaludo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  saludo: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  botonLogout: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: '#FEF2F2',
  },
  subtitulo: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 14,
  },
  tituloSeccionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tituloSeccion: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
  },
  tarjeta: {
    padding: 15,
    marginBottom: 12,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  filaFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconoFecha: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
  },
  fechaCita: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  horaCita: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 13,
  },
  badgeCita: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: '#FEF3C7',
  },
  textoBadgeCita: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeConfirmada: {
    backgroundColor: '#DCFCE7',
  },
  textoConfirmada: {
    color: '#15803D',
  },
  etiqueta: {
    marginTop: 15,
    marginBottom: 4,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  textoPrincipal: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  textoSecundario: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  botonPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 44,
    marginTop: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  textoBotonPrimario: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  confirmacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 15,
  },
  textoConfirmacion: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
  },
  filaMedicamento: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nombreMedicamento: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  filaIndicacion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
  },
  seccionHistorial: {
    marginTop: 12,
  },
  tarjetaHistorial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    marginBottom: 9,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  botonPdf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  textoBotonPdf: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  sinHistorial: {
    padding: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    color: colors.textSecondary,
    fontSize: 13,
  },
  tarjetaVacia: {
    alignItems: 'center',
    padding: 24,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tituloVacio: {
    marginTop: 10,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  textoVacio: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  cargando: {
    marginTop: 30,
  },
  presionado: {
    opacity: 0.7,
  },
  deshabilitado: {
    opacity: 0.55,
  },
});
