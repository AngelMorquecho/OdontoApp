import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { borderRadius, colors, shadows } from '../constants/theme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  titulo: string;
  children: React.ReactNode;
  /** Si es true, la sección inicia expandida. */
  iniciaAbierta?: boolean;
}

/** Sección de formulario desplegable (acordeón) usada en la Historia Clínica. */
export default function SeccionColapsable({
  titulo,
  children,
  iniciaAbierta = false,
}: Props) {
  const [abierta, setAbierta] = useState(iniciaAbierta);

  const alternar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAbierta((previo) => !previo);
  };

  return (
    <View style={styles.contenedor}>
      <Pressable
        onPress={alternar}
        style={({ pressed }) => [styles.encabezado, pressed && styles.presionado]}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
      >
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.icono}>{abierta ? '−' : '+'}</Text>
      </Pressable>
      {abierta && <View style={styles.contenido}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: 12,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  icono: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    width: 20,
    textAlign: 'center',
  },
  contenido: {
    padding: 16,
  },
  presionado: {
    opacity: 0.7,
  },
});
