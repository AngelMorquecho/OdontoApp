import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, colors, shadows } from '../../constants/theme';
import { DatosConsultorio } from '../../context/ConsultorioContext';
import { usePacientes } from '../../context/PacientesContext';
import { EstadoTratamiento, Receta } from '../../types';
import { Paciente } from '../../types/paciente';
import { compartirPdfReceta, generarPdfReceta } from '../../services/pdfRecetaService';

interface Props {
  paciente: Paciente;
  consultorio: DatosConsultorio;
  onNuevaReceta: () => void;
}

function fechaLegible(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  if (!anio || !mes || !dia) return fecha;
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function TabRecetasTratamiento({
  paciente,
  consultorio,
  onNuevaReceta,
}: Props) {
  const {
    getRecetasPaciente,
    actualizarEstadoTratamiento,
    cargandoRecetas,
  } = usePacientes();
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);
  const recetas = getRecetasPaciente(paciente.id);
  const recetasActivas = recetas.filter((receta) => receta.estadoTratamiento === 'activo');

  const compartirPdf = async (receta: Receta) => {
    setAccionEnCurso(`pdf-${receta.id}`);
    try {
      const uri = await generarPdfReceta(receta, paciente, consultorio);
      if (uri) {
        await compartirPdfReceta(uri);
      }
    } catch (error) {
      Alert.alert(
        'No se pudo compartir la receta',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setAccionEnCurso(null);
    }
  };

  const cambiarEstado = async (receta: Receta, estado: EstadoTratamiento) => {
    if (accionEnCurso) return;
    setAccionEnCurso(`estado-${receta.id}`);
    try {
      await actualizarEstadoTratamiento(receta.id, estado);
    } catch (error) {
      Alert.alert(
        'No se pudo actualizar el tratamiento',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setAccionEnCurso(null);
    }
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        accessibilityRole="button"
        onPress={onNuevaReceta}
        style={({ pressed }) => [
          styles.botonNuevaReceta,
          pressed && styles.presionado,
        ]}
      >
        <MaterialCommunityIcons name="plus-circle-outline" size={21} color={colors.surface} />
        <Text style={styles.textoNuevaReceta}>Nueva Receta</Text>
      </Pressable>

      <View style={styles.encabezadoSeccion}>
        <MaterialCommunityIcons name="pill" size={21} color={colors.primary} />
        <Text style={styles.tituloSeccion}>Tratamiento activo</Text>
      </View>
      {cargandoRecetas ? (
        <ActivityIndicator color={colors.primary} style={styles.indicador} />
      ) : recetasActivas.length > 0 ? (
        recetasActivas.map((recetaActiva) => (
          <View key={recetaActiva.id} style={styles.tarjetaActiva}>
            <View style={styles.filaEstado}>
              <View style={styles.badgeActivo}>
                <View style={styles.puntoActivo} />
                <Text style={styles.textoBadgeActivo}>Activo</Text>
              </View>
              <Text style={styles.fecha}>{fechaLegible(recetaActiva.fechaEmision)}</Text>
            </View>
            <Text style={styles.etiquetaSeccion}>Diagnóstico</Text>
            <Text style={styles.textoDiagnostico}>{recetaActiva.diagnostico}</Text>
            {recetaActiva.medicamentos.length > 0 && (
              <>
                <Text style={styles.etiquetaSeccion}>Medicamentos y horarios</Text>
                {recetaActiva.medicamentos.map((medicamento) => (
                  <View key={medicamento.id} style={styles.filaMedicamento}>
                    <MaterialCommunityIcons
                      name="pill"
                      size={18}
                      color={colors.primary}
                    />
                    <View style={styles.detalleMedicamento}>
                      <Text style={styles.nombreMedicamento}>{medicamento.nombre}</Text>
                      <Text style={styles.detalleTexto}>
                        {medicamento.dosis} · {medicamento.frecuencia} · {medicamento.duracion}
                      </Text>
                      {medicamento.indicaciones ? (
                        <Text style={styles.detalleTexto}>{medicamento.indicaciones}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </>
            )}
            {recetaActiva.indicacionesGenerales ? (
              <>
                <Text style={styles.etiquetaSeccion}>Cuidados y recomendaciones</Text>
                {recetaActiva.indicacionesGenerales
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((indicacion, indice) => (
                    <View key={`${indice}-${indicacion}`} style={styles.filaChecklist}>
                      <MaterialCommunityIcons
                        name="checkbox-marked-circle-outline"
                        size={18}
                        color={colors.success}
                      />
                      <Text style={styles.textoIndicacion}>{indicacion}</Text>
                    </View>
                  ))}
              </>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={accionEnCurso !== null}
              onPress={() => void cambiarEstado(recetaActiva, 'completado')}
              style={({ pressed }) => [
                styles.botonEstado,
                accionEnCurso !== null && styles.deshabilitado,
                pressed && styles.presionado,
              ]}
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={18}
                color={colors.success}
              />
              <Text style={styles.textoBotonEstado}>Marcar tratamiento completado</Text>
            </Pressable>
          </View>
        ))
      ) : (
        <View style={styles.vacio}>
          <MaterialCommunityIcons
            name="clipboard-text-outline"
            size={28}
            color={colors.textSecondary}
          />
          <Text style={styles.textoVacio}>No hay indicaciones activas para este paciente.</Text>
        </View>
      )}

      <View style={[styles.encabezadoSeccion, styles.encabezadoHistorial]}>
        <MaterialCommunityIcons name="history" size={21} color={colors.primary} />
        <Text style={styles.tituloSeccion}>Historial de recetas</Text>
      </View>
      {cargandoRecetas ? (
        <ActivityIndicator color={colors.primary} style={styles.indicador} />
      ) : recetas.length === 0 ? (
        <Text style={styles.sinHistorial}>Las recetas emitidas aparecerán aquí.</Text>
      ) : (
        recetas.map((receta) => (
          <View key={receta.id} style={styles.tarjetaHistorial}>
            <View style={styles.filaEstado}>
              <Text style={styles.fecha}>{fechaLegible(receta.fechaEmision)}</Text>
              <View
                style={[
                  styles.badgeEstado,
                  receta.estadoTratamiento === 'activo'
                    ? styles.badgeActivo
                    : styles.badgeCompletado,
                ]}
              >
                <Text
                  style={[
                    styles.textoBadgeEstado,
                    receta.estadoTratamiento === 'activo'
                      ? styles.textoBadgeActivo
                      : styles.textoBadgeCompletado,
                  ]}
                >
                  {receta.estadoTratamiento === 'activo' ? 'Activo' : 'Completado'}
                </Text>
              </View>
            </View>
            <Text style={styles.tituloDiagnostico}>{receta.diagnostico}</Text>
            <Text style={styles.resumenMedicamentos} numberOfLines={2}>
              {receta.medicamentos.length
                ? receta.medicamentos.map((medicamento) => medicamento.nombre).join(' · ')
                : 'Sin medicamentos'}
            </Text>
            <View style={styles.accionesHistorial}>
              {receta.estadoTratamiento === 'completado' && (
                <Pressable
                  accessibilityRole="button"
                  disabled={accionEnCurso !== null}
                  onPress={() => void cambiarEstado(receta, 'activo')}
                  style={({ pressed }) => [
                    styles.botonReactivar,
                    accionEnCurso !== null && styles.deshabilitado,
                    pressed && styles.presionado,
                  ]}
                >
                  <Text style={styles.textoReactivar}>Reactivar</Text>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                disabled={accionEnCurso !== null}
                onPress={() => void compartirPdf(receta)}
                style={({ pressed }) => [
                  styles.botonAccion,
                  pressed && styles.presionado,
                ]}
              >
                {accionEnCurso === `pdf-${receta.id}` ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons
                    name="file-pdf-box"
                    size={18}
                    color={colors.primary}
                  />
                )}
                <Text style={styles.textoAccion}>Ver PDF / Compartir</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contenido: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 100,
  },
  botonNuevaReceta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    marginBottom: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  textoNuevaReceta: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  encabezadoSeccion: {
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
  tarjetaActiva: {
    padding: 16,
    marginBottom: 22,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  filaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeActivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: '#DCFCE7',
  },
  puntoActivo: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  textoBadgeActivo: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  fecha: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  etiquetaSeccion: {
    marginTop: 16,
    marginBottom: 6,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  textoDiagnostico: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  filaMedicamento: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detalleMedicamento: {
    flex: 1,
  },
  nombreMedicamento: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  detalleTexto: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  filaChecklist: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  textoIndicacion: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  botonEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 42,
    marginTop: 18,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    backgroundColor: '#ECFDF5',
  },
  textoBotonEstado: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  vacio: {
    alignItems: 'center',
    gap: 8,
    padding: 20,
    marginBottom: 20,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  textoVacio: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  encabezadoHistorial: {
    marginTop: 4,
  },
  sinHistorial: {
    padding: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    color: colors.textSecondary,
    fontSize: 13,
  },
  tarjetaHistorial: {
    padding: 14,
    marginBottom: 10,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  badgeEstado: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeCompletado: {
    backgroundColor: colors.primaryLight,
  },
  textoBadgeEstado: {
    fontSize: 11,
    fontWeight: '700',
  },
  textoBadgeCompletado: {
    color: colors.primary,
  },
  tituloDiagnostico: {
    marginTop: 10,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  resumenMedicamentos: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13,
  },
  accionesHistorial: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 13,
  },
  botonAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  textoAccion: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  botonReactivar: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
  },
  textoReactivar: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  presionado: {
    opacity: 0.7,
  },
  deshabilitado: {
    opacity: 0.55,
  },
  indicador: {
    marginVertical: 18,
  },
});