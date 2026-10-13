import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  etiqueta: string;
  marcado: boolean;
  onChange: (marcado: boolean) => void;
}

/** Casilla de verificación simple (Sí/No visual tipo checkbox) para selección múltiple. */
export default function CampoCheckbox({ etiqueta, marcado, onChange }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.fila, pressed && styles.presionado]}
      onPress={() => onChange(!marcado)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcado }}
    >
      <View style={[styles.caja, marcado && styles.cajaMarcada]}>
        {marcado && <Text style={styles.check}>✓</Text>}
      </View>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 10,
  },
  caja: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cajaMarcada: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  check: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  etiqueta: {
    fontSize: 14,
    color: '#475569',
  },
  presionado: {
    opacity: 0.7,
  },
});
