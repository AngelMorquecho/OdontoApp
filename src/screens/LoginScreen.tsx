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
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { borderRadius, colors, shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen(_props: Props) {
  const {
    iniciarSesion,
    iniciarComoDoctor,
    iniciarComoPaciente,
    iniciarComoSuperAdmin,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  const autenticar = async (accion: () => Promise<boolean>) => {
    if (cargando) return;
    setCargando(true);
    try {
      const autenticado = await accion();
      if (!autenticado) {
        Alert.alert(
          'No se pudo iniciar sesión',
          'Usa una de las cuentas demo mostradas abajo y captura una contraseña.',
        );
      }
    } catch (error) {
      Alert.alert(
        'Error de acceso',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setCargando(false);
    }
  };

  const iniciarConFormulario = () => {
    if (!email.trim()) {
      Alert.alert('Correo requerido', 'Escribe el correo de una cuenta demo.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Contraseña requerida', 'Escribe tu contraseña para continuar.');
      return;
    }
    void autenticar(() => iniciarSesion(email, password));
  };

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
            <MaterialCommunityIcons
              name="tooth-outline"
              size={42}
              color={colors.surface}
            />
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
          <Text style={styles.descripcion}>
            Inicia sesión para continuar con tu atención.
          </Text>

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
              editable={!cargando}
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
              editable={!cargando}
              returnKeyType="done"
              onSubmitEditing={iniciarConFormulario}
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
            accessibilityState={{ disabled: cargando, busy: cargando }}
            disabled={cargando}
            onPress={iniciarConFormulario}
            style={({ pressed }) => [
              styles.botonPrimario,
              pressed && !cargando && styles.presionado,
              cargando && styles.deshabilitado,
            ]}
          >
            <Text style={styles.textoBotonPrimario}>
              {cargando ? 'Iniciando sesión…' : 'Iniciar Sesión'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.surface} />
          </Pressable>
        </View>

        <View style={styles.accesoDemo}>
          <View style={styles.separadorTitulo}>
            <View style={styles.linea} />
            <Text style={styles.tituloDemo}>Acceso rápido de prueba</Text>
            <View style={styles.linea} />
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={cargando}
            onPress={() => void autenticar(iniciarComoDoctor)}
            style={({ pressed }) => [
              styles.botonDemo,
              pressed && styles.presionado,
              cargando && styles.deshabilitado,
            ]}
          >
            <View style={styles.iconoDoctor}>
              <Ionicons name="medkit-outline" size={19} color={colors.primary} />
            </View>
            <View style={styles.infoDemo}>
              <Text style={styles.textoDemo}>Iniciar como Doctor</Text>
              <Text style={styles.correoDemo}>Dr. Alejandro Morales · doctor@dental.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={cargando}
            onPress={() => void autenticar(iniciarComoPaciente)}
            style={({ pressed }) => [
              styles.botonDemo,
              pressed && styles.presionado,
              cargando && styles.deshabilitado,
            ]}
          >
            <View style={[styles.iconoDoctor, styles.iconoPaciente]}>
              <Ionicons name="person-outline" size={19} color="#059669" />
            </View>
            <View style={styles.infoDemo}>
              <Text style={styles.textoDemo}>Iniciar como Paciente</Text>
              <Text style={styles.correoDemo}>María López · maria.lopez@email.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={cargando}
            onPress={() => void autenticar(iniciarComoSuperAdmin)}
            style={({ pressed }) => [
              styles.botonDemo,
              pressed && styles.presionado,
              cargando && styles.deshabilitado,
            ]}
          >
            <View style={[styles.iconoDoctor, styles.iconoAdmin]}>
              <Ionicons name="shield-checkmark-outline" size={19} color="#7C3AED" />
            </View>
            <View style={styles.infoDemo}>
              <Text style={styles.textoDemo}>Ingresar como Admin Master</Text>
              <Text style={styles.correoDemo}>Gestión exclusiva de doctores y licencias</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.avisoDemo}>
            Modo demostración: ingresa el correo de una de estas cuentas y cualquier contraseña no vacía.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 32,
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: 26,
  },
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
  brillo: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitulo: {
    maxWidth: 290,
    marginTop: 7,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  tarjeta: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tituloTarjeta: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  descripcion: {
    marginTop: 5,
    marginBottom: 12,
    color: colors.textSecondary,
    fontSize: 13,
  },
  etiqueta: {
    marginTop: 12,
    marginBottom: 7,
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
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
  textoBotonPrimario: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  accesoDemo: {
    marginTop: 24,
  },
  separadorTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 13,
  },
  linea: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  tituloDemo: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  botonDemo: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 12,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  iconoDoctor: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  iconoPaciente: {
    backgroundColor: '#DCFCE7',
  },
  iconoAdmin: {
    backgroundColor: '#EDE9FE',
  },
  infoDemo: {
    flex: 1,
    minWidth: 0,
  },
  textoDemo: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  correoDemo: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 11,
    flexShrink: 1,
  },
  avisoDemo: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  presionado: {
    opacity: 0.7,
  },
  deshabilitado: {
    opacity: 0.55,
  },
});
