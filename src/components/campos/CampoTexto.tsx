import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface Props extends Omit<TextInputProps, 'style'> {
  etiqueta: string;
}

/** Fila de formulario con etiqueta + TextInput, usada en toda la Historia Clínica. */
export default function CampoTexto({ etiqueta, ...resto }: Props) {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={[styles.input, resto.multiline && styles.inputMultilinea]}
        placeholderTextColor="#90A4AE"
        {...resto}
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
    color: '#455A64',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#F5F7F8',
    color: '#263238',
  },
  inputMultilinea: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
});
