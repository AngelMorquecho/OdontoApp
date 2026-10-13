import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import CronologiaNotas from './CronologiaNotas';
import FormularioNotaEvolucion from './FormularioNotaEvolucion';
import { NotaEvolucion } from '../../types/paciente';

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
    backgroundColor: '#0284C7',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  botonFlotantePresionado: {
    backgroundColor: '#1669AC',
  },
  botonFlotanteTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
