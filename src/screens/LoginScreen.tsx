import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { SvgXml } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { borderRadius, shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import {
  autenticarConBiometriaDirecta,
  checkBiometricAvailability,
  guardarCredencialesSeguras,
  obtenerCredencialesSeguras,
} from '../services/biometrics';

// Paleta de colores basada en tu logo
const GOLD_COLORS = {
  background: '#FAFAF7',
  surface: '#FFFFFF',
  primary: '#C59B27',
  primaryDark: '#A37F1E',
  border: '#E8DFC8',
  inputBg: '#F7F5EE',
  textPrimary: '#1A1A1A',
  textSecondary: '#555555',
  textMuted: '#777777',
};

const xmlPatronDientes = `
<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="toothPattern" width="100" height="100" patternUnits="userSpaceOnUse">
      <path d="M 30 15 C 20 15 15 22 15 32 C 15 42 20 52 23 60 C 25 65 25 75 30 75 C 33 75 33 68 35 63 C 37 68 37 75 40 75 C 45 75 45 65 47 60 C 50 52 55 42 55 32 C 55 22 50 15 40 15 C 37 15 35 18 35 20 C 35 18 33 15 30 15 Z" fill="none" stroke="#C59B27" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 80 65 C 70 65 65 72 65 82 C 65 92 70 102 73 110 C 75 115 75 125 80 125 C 83 125 83 118 85 113 C 87 118 87 125 90 125 C 95 125 95 115 97 110 C 100 102 105 92 105 82 C 105 72 100 65 90 65 C 87 65 85 68 85 70 C 85 68 83 65 80 65 Z" fill="none" stroke="#C59B27" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#toothPattern)" />
</svg>
`;

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen(_props: Props) {
  const { iniciarSesion, cargandoAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void intentarBiometriaAutomatica();
  }, []);

  const intentarBiometriaAutomatica = async () => {
    const tieneHardware = await checkBiometricAvailability();
    const credenciales = await obtenerCredencialesSeguras();

    // Solo se dispara si el celular tiene biometría y ya hay credenciales guardadas de un inicio anterior
    if (tieneHardware && credenciales) {
      setEmail(credenciales.email); // Auto-rellenar correo visualmente

      const exito = await autenticarConBiometriaDirecta();
      if (exito) {
        setEnviando(true);
        try {
          await iniciarSesion(credenciales.email, credenciales.password);
        } catch (error) {
          console.error('Error al iniciar sesión con biometría:', error);
        } finally {
          setEnviando(false);
        }
      }
    }
  };

  const autenticarManual = async () => {
    if (enviando) return;
    if (!email.trim() || !password) {
      Alert.alert('Datos requeridos', 'Ingresa tu correo electrónico y contraseña.');
      return;
    }
    setEnviando(true);
    try {
      await iniciarSesion(email, password);
      // Guardar credenciales de forma encriptada para las próximas aperturas de la app
      await guardarCredencialesSeguras(email, password);
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
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <SvgXml xml={xmlPatronDientes} width="100%" height="100%" style={styles.patronSvg} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.encabezado}>
          <Image
            source={require('../../assets/LogoDental.png')}
            style={styles.logoImagen}
            resizeMode="contain"
          />
          <Text style={styles.titulo}>DENTAL</Text>
          <Text style={styles.subtitulo}>MORQUECHO RODRIGUEZ.</Text>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>Bienvenido</Text>
          <Text style={styles.descripcion}>Inicia sesión para continuar con tu atención.</Text>

          <Text style={styles.etiqueta}>Correo electrónico</Text>
          <View style={styles.campo}>
            <Ionicons name="mail-outline" size={19} color={GOLD_COLORS.textPrimary} />
            <TextInput
              accessibilityLabel="Correo electrónico"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="nombre@correo.com"
              placeholderTextColor={GOLD_COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!bloqueado}
              returnKeyType="next"
            />
          </View>

          <Text style={styles.etiqueta}>Contraseña</Text>
          <View style={styles.campo}>
            <Ionicons name="lock-closed-outline" size={19} color={GOLD_COLORS.textPrimary} />
            <TextInput
              accessibilityLabel="Contraseña"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor={GOLD_COLORS.textMuted}
              secureTextEntry={!mostrarPassword}
              autoCapitalize="none"
              editable={!bloqueado}
              returnKeyType="done"
              onSubmitEditing={() => void autenticarManual()}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              hitSlop={8}
              onPress={() => setMostrarPassword((visible) => !visible)}
            >
              <Ionicons
                name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={GOLD_COLORS.textPrimary}
              />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: bloqueado, busy: enviando }}
            disabled={bloqueado}
            onPress={() => void autenticarManual()}
            style={({ pressed }) => [
              styles.botonPrimario,
              pressed && !bloqueado && styles.presionado,
              bloqueado && styles.deshabilitado,
            ]}
          >
            {enviando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.textoBotonPrimario}>Iniciar Sesión</Text>
            )}
            {!enviando && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
          </Pressable>
        </View>

        <View style={styles.piePagina}>
          <View style={styles.puntoDorado} />
          <Text style={styles.textoPie}>Atención Odontológica Especializada</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: GOLD_COLORS.background },
  patronSvg: { opacity: 0.08 },
  contenido: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingTop: 28, paddingBottom: 32 },
  encabezado: { alignItems: 'center', marginBottom: 26 },
  logoImagen: { width: 95, height: 95, marginBottom: 12 },
  titulo: { color: GOLD_COLORS.textPrimary, fontSize: 29, fontWeight: '800', letterSpacing: -0.5 },
  subtitulo: { maxWidth: 290, marginTop: 5, color: GOLD_COLORS.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center', fontWeight: '600' },
  tarjeta: { padding: 22, borderRadius: 22, backgroundColor: GOLD_COLORS.surface, borderWidth: 1, borderColor: GOLD_COLORS.border, ...shadows.sm },
  tituloTarjeta: { color: GOLD_COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  descripcion: { marginTop: 4, marginBottom: 14, color: GOLD_COLORS.textSecondary, fontSize: 13 },
  etiqueta: { marginTop: 12, marginBottom: 7, color: GOLD_COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  campo: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, borderWidth: 1.2, borderColor: GOLD_COLORS.border, borderRadius: borderRadius.md, backgroundColor: GOLD_COLORS.inputBg },
  input: { flex: 1, minWidth: 0, minHeight: 48, paddingVertical: 10, color: GOLD_COLORS.textPrimary, fontSize: 14, fontWeight: '500' },
  botonPrimario: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, paddingHorizontal: 16, borderRadius: borderRadius.md, backgroundColor: GOLD_COLORS.primary, ...shadows.sm },
  textoBotonPrimario: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  presionado: { opacity: 0.82, backgroundColor: GOLD_COLORS.primaryDark },
  deshabilitado: { opacity: 0.55 },
  piePagina: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28 },
  puntoDorado: { width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD_COLORS.primary },
  textoPie: { color: GOLD_COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
});