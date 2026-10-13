import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors } from '../../constants/theme';

interface Opcion<T extends string> {
  valor: T;
  etiqueta: string;
}

interface Props<T extends string> {
  etiqueta: string;
  valor: T;
  opciones: Opcion<T>[];
  onChange: (valor: T) => void;
}

/** Selector de opciones múltiples en formato de chips (sexo, pronóstico, higiene, etc.). */
export default function CampoOpciones<T extends string>({
  etiqueta,
  valor,
  opciones,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View style={styles.opciones}>
        {opciones.map((opcion) => {
          const seleccionado = valor === opcion.valor;
          return (
            <Pressable
              key={opcion.valor}
              onPress={() => onChange(opcion.valor)}
              style={({ pressed }) => [
                styles.chip,
                seleccionado && styles.chipSeleccionado,
                pressed && styles.presionado,
              ]}
            >
              <Text
                style={[
                  styles.chipTexto,
                  seleccionado && styles.chipTextoSeleccionado,
                ]}
              >
                {opcion.etiqueta}
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
    marginBottom: 14,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  opciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSeleccionado: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextoSeleccionado: {
    color: colors.surface,
  },
  presionado: {
    opacity: 0.7,
  },
});
