import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import FormularioReceta from '../components/recetas/FormularioReceta';
import { colors } from '../constants/theme';
import { useConsultorio } from '../context/ConsultorioContext';
import { usePacientes } from '../context/PacientesContext';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CrearReceta'>;

export default function ModalCrearReceta({ route, navigation }: Props) {
  const { pacienteId } = route.params;
  const { obtenerPaciente, crearReceta, cargandoRecetas } = usePacientes();
  const { consultorio, cargandoConsultorio } = useConsultorio();
  const paciente = obtenerPaciente(pacienteId);

  if (!paciente) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.error}>No se encontró el paciente de esta receta.</Text>
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
          <Text style={styles.paciente}>{paciente.nombre}</Text>
          <Text style={styles.descripcion}>
            Captura el diagnóstico, los medicamentos y los cuidados indicados.
          </Text>
        </View>
        <FormularioReceta
          paciente={paciente}
          consultorio={consultorio}
          onGuardar={crearReceta}
          onCompletada={() => navigation.goBack()}
          deshabilitado={cargandoRecetas || cargandoConsultorio}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: 16,
    paddingBottom: 32,
  },
  encabezado: {
    marginBottom: 16,
  },
  paciente: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  descripcion: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  error: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
});
