import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import SeccionColapsable from '../SeccionColapsable';
import SeccionDatosGenerales from './SeccionDatosGenerales';
import SeccionFactoresRiesgo from './SeccionFactoresRiesgo';
import SeccionMedicos from './SeccionMedicos';
import SeccionExploracion from './SeccionExploracion';
import SeccionDiagnostico from './SeccionDiagnostico';
import { HistoriaClinica } from '../../types/paciente';
import { borderRadius, colors } from '../../constants/theme';

interface Props {
  historiaClinica: HistoriaClinica;
  onGuardar: (nueva: HistoriaClinica) => void;
}

/**
 * Formulario completo de la Historia Clínica, organizado en secciones
 * desplegables. Mantiene un borrador local y solo persiste (vía onGuardar)
 * cuando el usuario presiona "Guardar", para evitar escrituras constantes
 * en AsyncStorage mientras se escribe.
 */
export default function HistoriaClinicaForm({ historiaClinica, onGuardar }: Props) {
  const [borrador, setBorrador] = useState<HistoriaClinica>(historiaClinica);
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);

  const actualizarBorrador = (nueva: HistoriaClinica) => {
    setBorrador(nueva);
    setHayCambiosSinGuardar(true);
  };

  const guardar = () => {
    onGuardar(borrador);
    setHayCambiosSinGuardar(false);
    Alert.alert('Historia clínica guardada', 'Los cambios se guardaron en el dispositivo.');
  };

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.contenedor}>
        <SeccionColapsable titulo="Datos de identificación" iniciaAbierta>
          <SeccionDatosGenerales historiaClinica={borrador} onChange={actualizarBorrador} />
        </SeccionColapsable>

        <SeccionColapsable titulo="Factores de riesgo y heredofamiliares">
          <SeccionFactoresRiesgo historiaClinica={borrador} onChange={actualizarBorrador} />
        </SeccionColapsable>

        <SeccionColapsable titulo="Antecedentes médicos">
          <SeccionMedicos historiaClinica={borrador} onChange={actualizarBorrador} />
        </SeccionColapsable>

        <SeccionColapsable titulo="Exploración clínica">
          <SeccionExploracion historiaClinica={borrador} onChange={actualizarBorrador} />
        </SeccionColapsable>

        <SeccionColapsable titulo="Diagnóstico y plan de tratamiento">
          <SeccionDiagnostico historiaClinica={borrador} onChange={actualizarBorrador} />
        </SeccionColapsable>
      </ScrollView>

      <View style={styles.barraGuardar}>
        {hayCambiosSinGuardar && (
          <Text style={styles.avisoCambios}>Tienes cambios sin guardar</Text>
        )}
        <Pressable
          style={({ pressed }) => [styles.boton, pressed && styles.botonPresionado]}
          onPress={guardar}
        >
          <Text style={styles.botonTexto}>Guardar historia clínica</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contenedor: {
    padding: 16,
    paddingBottom: 24,
  },
  barraGuardar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  avisoCambios: {
    textAlign: 'center',
    color: colors.danger,
    fontSize: 12,
    marginBottom: 8,
  },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonPresionado: {
    opacity: 0.7,
  },
  botonTexto: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
