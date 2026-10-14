import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-native';
import type { Usuario } from '../types';
import {
  cerrarSesionSupabase,
  iniciarSesionConContrasena,
  obtenerSesionActual,
  obtenerUsuarioDeSesion,
  suscribirCambiosDeSesion,
} from '../services/authService';

interface AuthContextValue {
  user: Usuario | null;
  isAuthenticated: boolean;
  cargandoAuth: boolean;
  iniciarSesion: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const cerrarSesionSolicitado = useRef(false);
  const autenticadoRef = useRef(false);

  useEffect(() => {
    let activo = true;
    const subscription = (() => {
      try {
        return suscribirCambiosDeSesion((event) => {
          if (event === 'SIGNED_OUT') {
            const eraAutenticado = autenticadoRef.current;
            autenticadoRef.current = false;
            setUser(null);
            setIsAuthenticated(false);
            if (eraAutenticado && !cerrarSesionSolicitado.current) {
              Alert.alert(
                'Sesión finalizada',
                'Tu sesión expiró o fue cerrada. Inicia sesión nuevamente para continuar.',
              );
            }
            return;
          }
        });
      } catch (error) {
        console.error(
          'No se pudo iniciar el observador de sesión de Supabase.',
          error,
        );
        return null;
      }
    })();

    void (async () => {
      let sessionPresent = false;
      try {
        const session = await obtenerSesionActual();
        sessionPresent = !!session;
        if (session?.user && activo) {
          const usuario = await obtenerUsuarioDeSesion(session.user);
          if (activo) {
            autenticadoRef.current = true;
            setUser(usuario);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        if (activo) {
          if (sessionPresent) {
            void cerrarSesionSupabase().catch((signOutError: unknown) => {
              Alert.alert(
                'No se pudo cerrar la sesión inválida',
                signOutError instanceof Error ? signOutError.message : 'Ocurrió un error inesperado.',
              );
            });
          }
          Alert.alert(
            'No se pudo recuperar la sesión',
            error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
          );
        }
      } finally {
        if (activo) setCargandoAuth(false);
      }
    })();

    return () => {
      activo = false;
      subscription?.unsubscribe();
    };
  }, []);

  const iniciarSesion = useCallback(async (
    email: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const resultado = await iniciarSesionConContrasena(email, password);
      autenticadoRef.current = true;
      setUser(resultado.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      Alert.alert(
        'Error de Autenticación',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<boolean> => {
    cerrarSesionSolicitado.current = true;
    try {
      await cerrarSesionSupabase();
      autenticadoRef.current = false;
      setUser(null);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      Alert.alert(
        'No se pudo cerrar sesión',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
      return false;
    } finally {
      cerrarSesionSolicitado.current = false;
    }
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated, cargandoAuth, iniciarSesion, logout }),
    [user, isAuthenticated, cargandoAuth, iniciarSesion, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return contexto;
}
