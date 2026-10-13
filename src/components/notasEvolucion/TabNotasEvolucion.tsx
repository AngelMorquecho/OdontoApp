import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import CronologiaNotas from './CronologiaNotas';
import FormularioNotaEvolucion from './FormularioNotaEvolucion';
import { NotaEvolucion } from '../../types/paciente';
import { borderRadius, colors, shadows } from '../../constants/theme';

interface Props {
  notas: NotaEvolucion[];
  onAgregarNota: (nota: NotaEvolucion) => void;
}

/** Pestaña de Notas de Evolución: cronología + alta de nuevas notas. */
export default function TabNotasEvolucion({ notas, onAgregarNota }: Props) {
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);

  const guardarNota = (nota: NotaEvolucion) => {
    onAgregarNota(nota);
    setMostrandoFormulario(false);
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
