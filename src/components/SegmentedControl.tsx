import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Opcion<T extends string> {
  valor: T;
  etiqueta: string;
}

interface Props<T extends string> {
  opciones: Opcion<T>[];
  valorSeleccionado: T;
  onSeleccionar: (valor: T) => void;
}

/** Menú de pestañas tipo segmented control, usado para alternar entre secciones. */
export default function SegmentedControl<T extends string>({
  opciones,
  valorSeleccionado,
  onSeleccionar,
}: Props<T>) {
  return (
    <View style={styles.contenedor}>
      {opciones.map((opcion) => {
        const activo = opcion.valor === valorSeleccionado;
        return (
          <Pressable
            key={opcion.valor}
            style={({ pressed }) => [
              styles.segmento,
              activo && styles.segmentoActivo,
              pressed && styles.presionado,
            ]}
            onPress={() => onSeleccionar(opcion.valor)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
          >
            <Text style={[styles.texto, activo && styles.textoActivo]}>
              {opcion.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    margin: 16,
    marginBottom: 8,
  },
  segmento: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentoActivo: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  texto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  textoActivo: {
    color: '#0284C7',
  },
  presionado: {
    opacity: 0.7,
  },
});
