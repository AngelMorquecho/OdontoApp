import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import CronologiaNotas from './CronologiaNotas';
import FormularioNotaEvolucion from './FormularioNotaEvolucion';
import { NotaEvolucion } from '../../types/paciente';
import { borderRadius, colors, shadows } from '../../constants/theme';

interface Props {
  notas: NotaEvolucion[];
  onAgregarNota: (nota: NotaEvolucion) => Promise<void>;
}

/** Pestaña de Notas de Evolución: cronología + alta de nuevas notas. */
export default function TabNotasEvolucion({ notas, onAgregarNota }: Props) {
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const guardarNota = async (nota: NotaEvolucion) => {
    if (guardando) return;
    setGuardando(true);
    try {
      await onAgregarNota(nota);
      setMostrandoFormulario(false);
    } catch (error) {
      Alert.alert(
        'No se pudo guardar la nota',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setGuardando(false);
    }
  };

  if (mostrandoFormulario) {
    return (
      <FormularioNotaEvolucion
        onGuardar={guardarNota}
        onCancelar={() => setMostrandoFormulario(false)}
      />
    );
  }

  return (
    <View style={styles.flex}>
      <CronologiaNotas notas={notas} />
      <Pressable
        style={({ pressed }) => [
          styles.botonFlotante,
          pressed && styles.botonFlotantePresionado,
        ]}
        onPress={() => setMostrandoFormulario(true)}
        accessibilityRole="button"
        accessibilityLabel="Agregar nota de evolución"
      >
        <Text style={styles.botonFlotanteTexto}>+ Agregar Nota de Evolución</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  botonFlotante: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.md,
  },
  botonFlotantePresionado: {
    opacity: 0.7,
  },
  botonFlotanteTexto: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
});
