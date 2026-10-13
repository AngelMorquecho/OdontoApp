import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../../constants/theme';

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
    marginBottom: 12,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: colors.background,
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
