import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

interface Opcion<T extends string> {
  valor: T;
  etiqueta: string;
  icono?: keyof typeof MaterialCommunityIcons.glyphMap;
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.contenedor}
    >
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
            {opcion.icono && (
              <MaterialCommunityIcons
                name={opcion.icono}
                size={16}
                color={activo ? '#fff' : '#475569'}
              />
            )}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              style={[styles.texto, activo && styles.textoActivo]}
            >
              {opcion.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 0,
    alignItems: 'center',
  },
  segmento: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  segmentoActivo: {
    backgroundColor: '#0284C7',
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
    flexShrink: 0,
  },
  textoActivo: {
    color: '#fff',
  },
  presionado: {
    opacity: 0.7,
  },
});
