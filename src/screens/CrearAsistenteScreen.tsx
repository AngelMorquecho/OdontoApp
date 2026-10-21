import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { crearAsistente } from '../services/asistentes';

export default function CrearAsistenteScreen({ navigation }: any) {
  const { user } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleCrear = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Atención', 'Por favor llena todos los campos obligatorios.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'No se identificó la sesión del doctor activo.');
      return;
    }

    setCargando(true);
    try {
      await crearAsistente({
        nombre,
        email,
        password,
        doctorId: user.id,
      });

      // Limpiar el formulario
      setNombre('');
      setEmail('');
      setPassword('');

      Alert.alert('¡Éxito!', 'Asistente registrada correctamente.', [
        {
          text: 'OK',
          onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('ListaAsistentes');
            }
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la asistente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.tituloSeccion}>Datos de la asistente</Text>

          <Text style={styles.label}>Nombre completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. María López"
            placeholderTextColor={colors.textSecondary}
            value={nombre}
            onChangeText={setNombre}
          />

          <Text style={styles.label}>Correo electrónico *</Text>
          <TextInput
            style={styles.input}
            placeholder="asistente@correo.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Contraseña *</Text>
          <View style={styles.inputPasswordContainer}>
            <TextInput
              style={styles.inputPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!mostrarPassword}
            />
            <Pressable
              onPress={() => setMostrarPassword((prev) => !prev)}
              style={styles.iconoPassword}
              hitSlop={8}
            >
              <Ionicons
                name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={cargando}
          onPress={handleCrear}
          style={({ pressed }) => [
            styles.btnGuardar,
            cargando && styles.btnDisabled,
            pressed && !cargando && styles.presionado,
          ]}
        >
          {cargando ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <Ionicons name="person-add" size={18} color={colors.surface} />
              <Text style={styles.btnText}>Guardar asistente</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: borderRadius.lg,
    marginBottom: 20,
    ...shadows.sm,
  },
  tituloSeccion: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    fontSize: 14,
  },
  inputPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    minHeight: 46,
    paddingRight: 12,
  },
  inputPassword: {
    flex: 1,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontSize: 14,
  },
  iconoPassword: {
    padding: 4,
  },
  btnGuardar: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...shadows.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  presionado: {
    opacity: 0.8,
  },
});