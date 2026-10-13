import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { usePacientes } from '../context/PacientesContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AgregarPaciente'>;

export default function AgregarPaciente({ navigation }: Props) {
  const { agregarPaciente } = usePacientes();

  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const nombreLimpio = nombre.trim();
    const edadNumero = Number(edad);

    if (!nombreLimpio) {
      Alert.alert('Falta información', 'Ingresa el nombre del paciente.');
      return;
    }
    if (!edad.trim() || Number.isNaN(edadNumero) || edadNumero <= 0) {
      Alert.alert('Falta información', 'Ingresa una edad válida.');
      return;
    }
    if (!telefono.trim()) {
      Alert.alert('Falta información', 'Ingresa un teléfono de contacto.');
      return;
    }

    setGuardando(true);
    try {
      await agregarPaciente({
        nombre: nombreLimpio,
        edad: edadNumero,
        telefono: telefono.trim(),
        motivoConsulta: motivoConsulta.trim() || 'Sin especificar',
      });
      navigation.goBack();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contenedor}>
        <Text style={styles.etiqueta}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
        />

        <Text style={styles.etiqueta}>Edad</Text>
        <TextInput
          style={styles.input}
          placeholder="Edad"
          value={edad}
          onChangeText={setEdad}
          keyboardType="number-pad"
        />

        <Text style={styles.etiqueta}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="Teléfono de contacto"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />

        <Text style={styles.etiqueta}>Motivo de consulta</Text>
        <TextInput
          style={[styles.input, styles.inputMultilinea]}
          placeholder="Motivo de consulta"
          value={motivoConsulta}
          onChangeText={setMotivoConsulta}
          multiline
          numberOfLines={3}
        />

        <Pressable
          style={({ pressed }) => [
            styles.boton,
            pressed && styles.botonPresionado,
            guardando && styles.botonDeshabilitado,
          ]}
          onPress={guardar}
          disabled={guardando}
        >
          <Text style={styles.botonTexto}>
            {guardando ? 'Guardando...' : 'Guardar paciente'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contenedor: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#455A64',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#F5F7F8',
  },
  inputMultilinea: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  boton: {
    marginTop: 28,
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonPresionado: {
    backgroundColor: '#1669AC',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
