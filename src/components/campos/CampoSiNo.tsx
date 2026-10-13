import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors } from '../../constants/theme';
import { SiNo } from '../../types/paciente';

interface Props {
  etiqueta: string;
  valor: SiNo;
  onChange: (valor: SiNo) => void;
}

/** Selector binario Sí/No usado en antecedentes y factores de riesgo. */
export default function CampoSiNo({ etiqueta, valor, onChange }: Props) {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View style={styles.opciones}>
        {(['si', 'no'] as SiNo[]).map((opcion) => {
          const seleccionado = valor === opcion;
          return (
            <Pressable
              key={opcion}
              onPress={() => onChange(opcion)}
              style={({ pressed }) => [
                styles.boton,
                seleccionado && styles.botonSeleccionado,
                pressed && styles.presionado,
              ]}
            >
              <Text
                style={[
                  styles.botonTexto,
                  seleccionado && styles.botonTextoSeleccionado,
                ]}
              >
                {opcion === 'si' ? 'Sí' : 'No'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: 12,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 14,
    marginBottom: 6,
  },
  opciones: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 12,
  },
  boton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 8,
    backgroundColor: colors.surface,
  },
  botonSeleccionado: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  botonTexto: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  botonTextoSeleccionado: {
    color: colors.surface,
  },
  presionado: {
    opacity: 0.7,
  },
});
