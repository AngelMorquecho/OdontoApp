import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const secureStoragePrefix = 'odontoapp.supabase.session';
const maxSecureStoreChunkLength = 1600;
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    }

    const baseKey = `${secureStoragePrefix}.${key}`;
    const metadata = await SecureStore.getItemAsync(`${baseKey}.meta`);
    if (metadata === null) return SecureStore.getItemAsync(baseKey);

    const count = Number(metadata);
    if (!Number.isSafeInteger(count) || count < 1) {
      throw new Error('La sesión cifrada tiene metadatos no válidos.');
    }
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        SecureStore.getItemAsync(`${baseKey}.chunk.${index}`),
      ),
    );
    if (chunks.some((chunk) => chunk === null)) {
      throw new Error('No se pudo recuperar completa la sesión cifrada.');
    }
    return chunks.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') {
        throw new Error('El almacenamiento de sesión no está disponible en este navegador.');
      }
      localStorage.setItem(key, value);
      return;
    }

    const baseKey = `${secureStoragePrefix}.${key}`;
    const chunks: string[] = [];
    let chunk = '';
    for (const character of value) {
      if (chunk.length + character.length > maxSecureStoreChunkLength) {
        chunks.push(chunk);
        chunk = '';
      }
      chunk += character;
    }
    if (chunk || chunks.length === 0) chunks.push(chunk);

    const previousCount = Number(await SecureStore.getItemAsync(`${baseKey}.meta`));
    try {
      await Promise.all(chunks.map((part, index) =>
        SecureStore.setItemAsync(`${baseKey}.chunk.${index}`, part),
      ));
      await SecureStore.setItemAsync(`${baseKey}.meta`, String(chunks.length));
      if (Number.isSafeInteger(previousCount) && previousCount > chunks.length) {
        await Promise.all(
          Array.from({ length: previousCount - chunks.length }, (_, offset) =>
            SecureStore.deleteItemAsync(`${baseKey}.chunk.${chunks.length + offset}`),
          ),
        );
      }
      await SecureStore.deleteItemAsync(baseKey);
    } catch (error) {
      await Promise.all([
        SecureStore.deleteItemAsync(`${baseKey}.meta`),
        ...chunks.map((_, index) =>
          SecureStore.deleteItemAsync(`${baseKey}.chunk.${index}`),
        ),
      ]);
      throw error;
    }
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return;
    }
    const baseKey = `${secureStoragePrefix}.${key}`;
    const count = Number(await SecureStore.getItemAsync(`${baseKey}.meta`));
    await Promise.all([
      SecureStore.deleteItemAsync(baseKey),
      SecureStore.deleteItemAsync(`${baseKey}.meta`),
      ...(Number.isSafeInteger(count) && count > 0
        ? Array.from({ length: count }, (_, index) =>
            SecureStore.deleteItemAsync(`${baseKey}.chunk.${index}`),
          )
        : []),
    ]);
  },
};

let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      'Falta configurar EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY en el entorno.',
    );
  }
  try {
    client = createClient(url, anonKey, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    throw new Error(
      `No se pudo inicializar Supabase: ${error instanceof Error ? error.message : 'configuración no válida.'}`,
    );
  }
  return client;
}
