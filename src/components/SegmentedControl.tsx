import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { borderRadius, colors, shadows } from '../constants/theme';

interface Opcion<T extends string> {
  valor: T;
  etiqueta: string;
  icono?: keyof typeof MaterialCommunityIcons.glyphMap;
  color?: string;
  fondo?: string;
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
              activo && (opcion.color ? styles.segmentoEstadoActivo : styles.segmentoActivo),
              opcion.fondo && { backgroundColor: opcion.fondo },
              opcion.color && {
                borderColor: activo ? opcion.color : opcion.fondo ?? opcion.color,
              },
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
                color={opcion.color ?? (activo ? colors.surface : colors.textSecondary)}
              />
            )}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              style={[
                styles.texto,
                activo && !opcion.color && styles.textoActivo,
                opcion.color && { color: opcion.color },
              ]}
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
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  segmentoActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  segmentoEstadoActivo: {
    ...shadows.sm,
  },
  texto: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 0,
  },
  textoActivo: {
    color: colors.surface,
  },
  presionado: {
    opacity: 0.7,
  },
});
