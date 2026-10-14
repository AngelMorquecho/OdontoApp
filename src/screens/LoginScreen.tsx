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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { borderRadius, colors, shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen(_props: Props) {
  const { iniciarSesion, cargandoAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const autenticar = async () => {
    if (enviando) return;
    if (!email.trim() || !password) {
      Alert.alert('Datos requeridos', 'Ingresa tu correo electrónico y contraseña.');
      return;
    }
    setEnviando(true);
    try {
      await iniciarSesion(email, password);
    } finally {
      setEnviando(false);
    }
  };

  const bloqueado = enviando || cargandoAuth;
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.encabezado}>
          <View style={styles.logo}>
            <MaterialCommunityIcons name="tooth-outline" size={42} color={colors.surface} />
            <View style={styles.brillo}>
              <Ionicons name="sparkles" size={15} color={colors.surface} />
            </View>
          </View>
          <Text style={styles.titulo}>DentalCare</Text>
          <Text style={styles.subtitulo}>
            Gestión médica y portal de salud para pacientes
          </Text>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>Bienvenido</Text>
          <Text style={styles.descripcion}>Inicia sesión para continuar con tu atención.</Text>

          <Text style={styles.etiqueta}>Correo electrónico</Text>
          <View style={styles.campo}>
            <Ionicons name="mail-outline" size={19} color={colors.textSecondary} />
            <TextInput
              accessibilityLabel="Correo electrónico"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="nombre@correo.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!bloqueado}
              returnKeyType="next"
            />
          </View>

          <Text style={styles.etiqueta}>Contraseña</Text>
          <View style={styles.campo}>
            <Ionicons name="lock-closed-outline" size={19} color={colors.textSecondary} />
            <TextInput
              accessibilityLabel="Contraseña"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!mostrarPassword}
              autoCapitalize="none"
              editable={!bloqueado}
              returnKeyType="done"
              onSubmitEditing={() => void autenticar()}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              accessibilityState={{ selected: mostrarPassword }}
              hitSlop={8}
              onPress={() => setMostrarPassword((visible) => !visible)}
            >
              <Ionicons
                name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: bloqueado, busy: enviando }}
            disabled={bloqueado}
            onPress={() => void autenticar()}
            style={({ pressed }) => [
              styles.botonPrimario,
              pressed && !bloqueado && styles.presionado,
              bloqueado && styles.deshabilitado,
            ]}
          >
            {enviando ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.textoBotonPrimario}>Iniciar Sesión</Text>
            )}
            {!enviando && <Ionicons name="arrow-forward" size={18} color={colors.surface} />}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 32,
  },
  encabezado: { alignItems: 'center', marginBottom: 26 },
  logo: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  brillo: { position: 'absolute', top: 12, right: 12 },
  titulo: { color: colors.textPrimary, fontSize: 29, fontWeight: '800', letterSpacing: -0.5 },
  subtitulo: {
    maxWidth: 290,
    marginTop: 7,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  tarjeta: { padding: 20, borderRadius: 20, backgroundColor: colors.surface, ...shadows.sm },
  tituloTarjeta: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  descripcion: { marginTop: 5, marginBottom: 12, color: colors.textSecondary, fontSize: 13 },
  etiqueta: { marginTop: 12, marginBottom: 7, color: '#334155', fontSize: 13, fontWeight: '600' },
  campo: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: borderRadius.md,
    backgroundColor: '#F1F5F9',
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
  },
  botonPrimario: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  textoBotonPrimario: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  presionado: { opacity: 0.7 },
  deshabilitado: { opacity: 0.55 },
});
