import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { usePacientes } from '../context/PacientesContext';
import { borderRadius, colors } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AgregarPaciente'>;

export default function AgregarPaciente({ navigation }: Props) {
  const { agregarPaciente } = usePacientes();

  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const nombreLimpio = nombre.trim();
    const edadIngresada = Number(edad);
    const nacimiento = fechaNacimiento.trim();

    if (!nombreLimpio) {
      Alert.alert('Falta información', 'Ingresa el nombre completo del paciente.');
      return;
    }
    if (!telefono.trim()) {
      Alert.alert('Falta información', 'Ingresa un teléfono de contacto.');
      return;
    }

    let edadNumero = edadIngresada;
    if (nacimiento) {
      const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nacimiento);
      if (!coincidencia) {
        Alert.alert('Fecha no válida', 'Ingresa la fecha de nacimiento con formato AAAA-MM-DD.');
        return;
      }
      const [, anio, mes, dia] = coincidencia;
      const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
      if (
        fecha.getFullYear() !== Number(anio) ||
        fecha.getMonth() !== Number(mes) - 1 ||
        fecha.getDate() !== Number(dia) ||
        fecha > new Date()
      ) {
        Alert.alert('Fecha no válida', 'Verifica la fecha de nacimiento.');
        return;
      }
      const hoy = new Date();
      edadNumero =
        hoy.getFullYear() -
        fecha.getFullYear() -
        (hoy.getMonth() < fecha.getMonth() ||
        (hoy.getMonth() === fecha.getMonth() && hoy.getDate() < fecha.getDate())
          ? 1
          : 0);
    } else if (!edad.trim() || Number.isNaN(edadIngresada) || edadIngresada <= 0) {
      Alert.alert('Falta información', 'Ingresa una edad o fecha de nacimiento válida.');
      return;
    }
    if (correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      Alert.alert('Correo no válido', 'Revisa el formato del correo electrónico.');
      return;
    }

    setGuardando(true);
    try {
      await agregarPaciente({
        nombre: nombreLimpio,
        edad: edadNumero,
        telefono: telefono.trim(),
        ...(nacimiento ? { fechaNacimiento: nacimiento } : {}),
        ...(correo.trim() ? { correo: correo.trim() } : {}),
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
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Datos demográficos</Text>
          <Text style={styles.etiqueta}>Nombre completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.etiqueta}>Edad (años)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa edad o fecha de nacimiento"
            value={edad}
            onChangeText={setEdad}
            keyboardType="number-pad"
            editable={!fechaNacimiento}
          />

          <Text style={styles.etiqueta}>Fecha de nacimiento</Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-DD"
            value={fechaNacimiento}
            onChangeText={setFechaNacimiento}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          <Text style={styles.ayuda}>Requerido: edad o fecha de nacimiento.</Text>

          <Text style={styles.etiqueta}>Teléfono *</Text>
          <TextInput
            style={styles.input}
            placeholder="Teléfono de contacto"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />

          <Text style={styles.etiqueta}>Correo (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.boton,
            pressed && styles.botonPresionado,
            guardando && styles.botonDeshabilitado,
          ]}
          onPress={guardar}
          disabled={guardando}
        >
          <Ionicons name="person-add-outline" size={19} color={colors.surface} />
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
    paddingBottom: 32,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  tarjeta: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tituloSeccion: {
    marginBottom: 4,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    minHeight: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: '#F8FAFC',
  },
  ayuda: { marginTop: 6, color: colors.textSecondary, fontSize: 12 },
  boton: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonPresionado: {
    opacity: 0.7,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonTexto: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
