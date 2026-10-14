import React, { useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Odontograma2D from '../components/Odontograma2D';
import { Odontograma } from '../components/types/odontograma';
import { usePacientes } from '../context/PacientesContext';
import { crearHistoriaClinicaVacia, HistoriaClinica, NotaEvolucion, Radiografia } from '../types/paciente';
import { useConsultorio } from '../context/ConsultorioContext';
import HistoriaClinicaForm from '../components/historiaClinica/HistoriaClinicaForm';
import TabNotasEvolucion from '../components/notasEvolucion/TabNotasEvolucion';
import TabRadiografias from '../components/radiografias/TabRadiografias';
import TabRecetasTratamiento from '../components/recetas/TabRecetasTratamiento';
import TabTratamientosPagos from '../components/tratamientos/TabTratamientosPagos';
import { borderRadius, colors } from '../constants/theme';
import { obtenerUltimaCitaPaciente } from '../utils/citas';

type Props = NativeStackScreenProps<RootStackParamList, 'DetallePaciente'>;

type Pestana = 'odontograma' | 'historia' | 'notas' | 'radiografias' | 'recetas' | 'pagos';

const OPCIONES_PESTANAS: {
  valor: Pestana;
  etiqueta: string;
  icono: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { valor: 'odontograma', etiqueta: 'Odontograma', icono: 'tooth' },
  { valor: 'historia', etiqueta: 'Historia Clínica', icono: 'clipboard-text-outline' },
  { valor: 'notas', etiqueta: 'Notas de Evolución', icono: 'note-text-outline' },
  { valor: 'radiografias', etiqueta: 'Radiografías / Galería', icono: 'image-multiple-outline' },
  { valor: 'recetas', etiqueta: 'Recetas y Tratamiento', icono: 'pill' },
  { valor: 'pagos', etiqueta: 'Tratamientos y Pagos', icono: 'cash-multiple' },
];

export default function DetallePaciente({ route, navigation }: Props) {
  const { pacienteId } = route.params;
  const {
    obtenerPaciente,
    citas,
    actualizarOdontograma,
    actualizarHistoriaClinica,
    agregarNotaEvolucion,
    agregarRadiografia,
  } = usePacientes();
  const paciente = obtenerPaciente(pacienteId);
  const { consultorio } = useConsultorio();
  const [pestanaLocal, setPestanaLocal] = useState<Pestana>('odontograma');
  const pestana = route.params.pestana ?? pestanaLocal;

  const cambiarPestana = (siguiente: Pestana) => {
    setPestanaLocal(siguiente);
    if (route.params.pestana) navigation.setParams({ pestana: undefined });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: paciente?.nombre ?? 'Paciente',
      headerRight: undefined,
    });
  }, [navigation, paciente?.nombre]);

  if (!paciente) {
    return (
      <View style={styles.centrado}>
        <Text>No se encontró información del paciente.</Text>
      </View>
    );
  }

  const alCambiarOdontograma = (nuevo: Odontograma) => {
    void actualizarOdontograma(pacienteId, nuevo);
  };

  const alGuardarHistoriaClinica = (nueva: HistoriaClinica) => {
    return actualizarHistoriaClinica(pacienteId, nueva);
  };

  const alAgregarNota = (nota: NotaEvolucion) => {
    return agregarNotaEvolucion(pacienteId, nota);
  };

  const alAgregarRadiografia = (radiografia: Radiografia) => {
    return agregarRadiografia(pacienteId, radiografia);
  };

  return (
    <View style={styles.flex}>
      <View style={styles.encabezadoYPestanas}>
        <View style={styles.encabezado}>
          <Text style={styles.nombre}>{paciente.nombre}</Text>
          <Text style={styles.detalle}>
            {paciente.edad} años · {paciente.telefono}
          </Text>
          <Text style={styles.motivo}>
            Motivo de consulta: {obtenerUltimaCitaPaciente(pacienteId, citas)?.motivoConsulta ?? 'Sin citas registradas'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('AgendarCita', { pacienteId })}
            style={({ pressed }) => [styles.botonAgendar, pressed && styles.botonPresionado]}
          >
            <MaterialCommunityIcons name="calendar-plus" size={18} color={colors.primary} />
            <Text style={styles.textoAgendar}>Agendar cita</Text>
          </Pressable>
        </View>

        <View style={styles.barraPestanas}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listaPestanas}
          >
            {OPCIONES_PESTANAS.map((opcion) => {
              const activa = pestana === opcion.valor;
              return (
                <Pressable
                  key={opcion.valor}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activa }}
                  onPress={() => cambiarPestana(opcion.valor)}
                  style={({ pressed }) => [
                    styles.chipPestana,
                    activa && styles.chipPestanaActivo,
                    pressed && styles.chipPestanaPresionado,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={opcion.icono}
                    size={16}
                    color={activa ? colors.surface : colors.textSecondary}
                  />
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    style={[styles.textoPestana, activa && styles.textoPestanaActivo]}
                  >
                    {opcion.etiqueta}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <View style={styles.contenidoPestana}>
        {pestana === 'odontograma' && (
          <ScrollView contentContainerStyle={styles.contenidoOdontograma}>
            <View style={styles.guiaOdontograma}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={colors.primary}
              />
              <View style={styles.contenidoGuiaOdontograma}>
                <Text style={styles.tituloGuiaOdontograma}>Guía de Odontograma</Text>
                <Text style={styles.textoGuiaOdontograma}>
                  Toca cualquier cara del diente (Oclusal, Vestibular, Lingual, Mesial,
                  Distal) para cambiar su estado: Blanco = Sano | Rojo = Caries | Azul =
                  Obturación/Restaurado.
                </Text>
              </View>
            </View>
            <Odontograma2D
              odontograma={paciente.odontograma}
              onChange={alCambiarOdontograma}
            />
          </ScrollView>
        )}

        {pestana === 'historia' && (
          <HistoriaClinicaForm
            historiaClinica={paciente.historiaClinica ?? crearHistoriaClinicaVacia()}
            onGuardar={alGuardarHistoriaClinica}
          />
        )}

        {pestana === 'notas' && (
          <TabNotasEvolucion
            notas={paciente.historiaClinica?.notasEvolucion ?? []}
            onAgregarNota={alAgregarNota}
          />
        )}

        {pestana === 'radiografias' && (
          <TabRadiografias
            radiografias={paciente.radiografias ?? []}
            onAgregar={alAgregarRadiografia}
          />
        )}

        {pestana === 'recetas' && (
          <TabRecetasTratamiento
            paciente={paciente}
            consultorio={consultorio}
            onNuevaReceta={() =>
              navigation.navigate('CrearReceta', { pacienteId })
            }
          />
        )}

        {pestana === 'pagos' && (
          <TabTratamientosPagos
            paciente={paciente}
            consultorio={consultorio}
            navigation={navigation}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  encabezado: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 0,
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  encabezadoYPestanas: {
    flexGrow: 0,
    paddingBottom: 0,
    backgroundColor: colors.surface,
  },
  barraPestanas: {
    marginTop: 8,
    marginBottom: 16,
  },
  nombre: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  detalle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    flexShrink: 1,
  },
  motivo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    flexShrink: 1,
  },
  botonAgendar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  botonPresionado: {
    opacity: 0.7,
  },
  textoAgendar: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  listaPestanas: {
    paddingHorizontal: 12,
    paddingVertical: 0,
    alignItems: 'center',
    flexGrow: 0,
  },
  chipPestana: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 210,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipPestanaActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPestanaPresionado: {
    opacity: 0.7,
  },
  textoPestana: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  textoPestanaActivo: {
    color: colors.surface,
  },
  contenidoPestana: {
    flex: 1,
    paddingTop: 12,
  },
  contenidoOdontograma: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 16,
    flexGrow: 1,
  },
  guiaOdontograma: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: borderRadius.md,
    backgroundColor: '#EFF6FF',
  },
  contenidoGuiaOdontograma: {
    flex: 1,
  },
  tituloGuiaOdontograma: {
    marginBottom: 4,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  textoGuiaOdontograma: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
