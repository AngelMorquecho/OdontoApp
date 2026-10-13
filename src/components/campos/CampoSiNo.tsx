import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
              style={[styles.boton, seleccionado && styles.botonSeleccionado]}
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
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  etiqueta: {
    fontSize: 14,
    color: '#455A64',
    flex: 1,
    paddingRight: 8,
  },
  opciones: {
    flexDirection: 'row',
  },
  boton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    marginLeft: 8,
  },
  botonSeleccionado: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  botonTexto: {
    fontSize: 14,
    color: '#455A64',
    fontWeight: '600',
  },
  botonTextoSeleccionado: {
    color: '#fff',
  },
});
