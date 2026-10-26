import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const SECURE_KEY = 'odontoapp_user_credentials';

export const guardarCredencialesSeguras = async (email: string, password: string) => {
  try {
    const credenciales = JSON.stringify({ email, password });
    await SecureStore.setItemAsync(SECURE_KEY, credenciales);
    return true;
  } catch (error) {
    console.error('Error al guardar credenciales:', error);
    return false;
  }
};

export const obtenerCredencialesSeguras = async () => {
  try {
    const resultado = await SecureStore.getItemAsync(SECURE_KEY);
    return resultado ? JSON.parse(resultado) : null;
  } catch (error) {
    console.error('Error al leer credenciales:', error);
    return null;
  }
};

export const borrarCredencialesSeguras = async () => {
  try {
    await SecureStore.deleteItemAsync(SECURE_KEY);
    return true;
  } catch (error) {
    console.error('Error al borrar credenciales:', error);
    return false;
  }
};

export const checkBiometricAvailability = async () => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch (error) {
    console.error('Error al verificar hardware biométrico:', error);
    return false;
  }
};

/**
 * Lógica Native Standard de iOS/Android:
 * 1. Lanza Face ID directamente por defecto.
 * 2. Si Face ID falla 2 veces o el usuario no es reconocido, el sistema operativo
 *    despliega automáticamente el botón de fallback para validar con el PIN/Código del iPhone.
 */
export const autenticarConBiometriaDirecta = async () => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Ingresar a OdontoApp',
      fallbackLabel: 'Ingresar código del iPhone', // Etiqueta nativa si falla Face ID
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false, // OBLIGATORIO: Permite que iOS use el PIN como respaldo seguro si falla el rostro
    });

    if (!result.success && result.error) {
      console.log('Resultado de autenticación:', result.error);
    }

    return result.success;
  } catch (error) {
    Alert.alert('Error de Autenticación', String(error));
    return false;
  }
};