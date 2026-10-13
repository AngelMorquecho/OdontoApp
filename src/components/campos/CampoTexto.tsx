import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { borderRadius, colors } from '../../constants/theme';

interface Props extends Omit<TextInputProps, 'style'> {
  etiqueta: string;
}

/** Fila de formulario con etiqueta + TextInput, usada en toda la Historia Clínica. */
export default function CampoTexto({ etiqueta, ...resto }: Props) {
  const [enfocado, setEnfocado] = useState(false);
  const { onFocus, onBlur, ...propsInput } = resto;

  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={[
          styles.input,
          enfocado && styles.inputEnfocado,
          propsInput.multiline && styles.inputMultilinea,
        ]}
        placeholderTextColor={colors.textSecondary}
        onFocus={(evento) => {
          setEnfocado(true);
          onFocus?.(evento);
        }}
        onBlur={(evento) => {
          setEnfocado(false);
          onBlur?.(evento);
        }}
        {...propsInput}
      />
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
  input: {
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  inputEnfocado: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  inputMultilinea: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
});
