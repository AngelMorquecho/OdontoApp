import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Odontograma2D from '../components/Odontograma2D';
import { Odontograma } from '../components/types/odontograma';
import { usePacientes } from '../context/PacientesContext';
import { crearHistoriaClinicaVacia, HistoriaClinica, NotaEvolucion, Radiografia } from '../types/paciente';
import { generarYCompartirPdfExpediente } from '../utils/generarPdfExpediente';
import SegmentedControl from '../components/SegmentedControl';
import HistoriaClinicaForm from '../components/historiaClinica/HistoriaClinicaForm';
import TabNotasEvolucion from '../components/notasEvolucion/TabNotasEvolucion';
import TabRadiografias from '../components/radiografias/TabRadiografias';

type Props = NativeStackScreenProps<RootStackParamList, 'DetallePaciente'>;

type Pestana = 'odontograma' | 'historia' | 'notas' | 'radiografias';

const OPCIONES_PESTANAS: { valor: Pestana; etiqueta: string }[] = [
  { valor: 'odontograma', etiqueta: 'Odontograma' },
  { valor: 'historia', etiqueta: 'Historia Clínica' },
  { valor: 'notas', etiqueta: 'Notas de Evolución' },
  { valor: 'radiografias', etiqueta: 'Radiografías / Galería' },
];

export default function DetallePaciente({ route, navigation }: Props) {
  const { pacienteId } = route.params;
  const {
    obtenerPaciente,
    actualizarOdontograma,
    actualizarHistoriaClinica,
    agregarNotaEvolucion,
    agregarRadiografia,
  } = usePacientes();
  const paciente = obtenerPaciente(pacienteId);
  const [pestana, setPestana] = useState<Pestana>('odontograma');
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const exportacionEnCurso = useRef(false);

  const alExportarPdf = useCallback(async () => {
    if (!paciente || exportacionEnCurso.current) return;

    exportacionEnCurso.current = true;
    setExportandoPdf(true);
    try {
      await generarYCompartirPdfExpediente(paciente);
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      Alert.alert('No se pudo exportar el PDF', mensaje);
    } finally {
      exportacionEnCurso.current = false;
      setExportandoPdf(false);
    }
  }, [paciente]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: paciente?.nombre ?? 'Paciente',
      headerRight: paciente
        ? () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Exportar expediente en PDF"
              accessibilityState={{ disabled: exportandoPdf, busy: exportandoPdf }}
              disabled={exportandoPdf}
              hitSlop={8}
              onPress={() => {
                void alExportarPdf();
              }}
            >
              <Text style={styles.botonExportarPdf}>
                {exportandoPdf ? 'Preparando…' : 'Exportar PDF'}
              </Text>
            </Pressable>
          )
        : undefined,
    });
  }, [alExportarPdf, exportandoPdf, navigation, paciente]);

  if (!paciente) {
    return (
      <View style={styles.centrado}>
        <Text>No se encontró información del paciente.</Text>
      </View>
    );
  }

  const alCambiarOdontograma = (nuevo: Odontograma) => {
    // Se guarda en el contexto, que a su vez persiste en AsyncStorage.
    actualizarOdontograma(pacienteId, nuevo);
  };

  const alGuardarHistoriaClinica = (nueva: HistoriaClinica) => {
    actualizarHistoriaClinica(pacienteId, nueva);
  };

  const alAgregarNota = (nota: NotaEvolucion) => {
    agregarNotaEvolucion(pacienteId, nota);
  };

  const alAgregarRadiografia = (radiografia: Radiografia) => {
    agregarRadiografia(pacienteId, radiografia);
  };

  return (
    <View style={styles.flex}>
      <View style={styles.encabezado}>
        <Text style={styles.nombre}>{paciente.nombre}</Text>
        <Text style={styles.detalle}>
          {paciente.edad} años · {paciente.telefono}
        </Text>
        <Text style={styles.motivo}>
          Motivo de consulta: {paciente.motivoConsulta}
        </Text>
      </View>

      <SegmentedControl
        opciones={OPCIONES_PESTANAS}
        valorSeleccionado={pestana}
        onSeleccionar={setPestana}
      />

      {pestana === 'odontograma' && (
        <ScrollView contentContainerStyle={styles.contenidoOdontograma}>
          <Odontograma2D
            odontograma={paciente.odontograma}
            onChange={alCambiarOdontograma}
          />
          <Text style={styles.ayuda}>
            Toca una cara: sana → caries → obturación → sana
          </Text>
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
          onAnalizar={() => navigation.navigate('DiagnosticoIa', { pacienteId })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  encabezado: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF1',
  },
  nombre: {
    fontSize: 20,
    fontWeight: '700',
    color: '#263238',
  },
  detalle: {
    fontSize: 13,
    color: '#607D8B',
    marginTop: 4,
  },
  motivo: {
    fontSize: 13,
    color: '#455A64',
    marginTop: 6,
  },
  botonExportarPdf: {
    color: '#1E88E5',
    fontSize: 13,
    fontWeight: '600',
  },
  contenidoOdontograma: {
    padding: 16,
    flexGrow: 1,
  },
  ayuda: {
    marginTop: 12,
    color: '#607D8B',
  },
});
