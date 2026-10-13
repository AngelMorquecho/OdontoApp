import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';
import type { Paciente } from '../types/paciente';
import { RolUsuario, Usuario } from '../types';
import { CLAVES_DATOS } from '../utils/seedData';

interface AuthContextValue {
  user: Usuario | null;
  isAuthenticated: boolean;
  cargandoAuth: boolean;
  iniciarSesion: (email: string, password: string) => Promise<boolean>;
  iniciarComoDoctor: () => Promise<boolean>;
  iniciarComoPaciente: () => Promise<boolean>;
  logout: () => Promise<boolean>;
  seleccionarRolDoctor: () => Promise<void>;
  seleccionarPaciente: (paciente: Paciente) => Promise<void>;
}

const USUARIO_DOCTOR_DEMO: Usuario = {
  id: 'doctor-demo-alejandro',
  nombre: 'Dr. Alejandro Morales',
  email: 'doctor@dental.com',
  rol: 'doctor',
};

const USUARIO_PACIENTE_DEMO: Usuario = {
  id: 'paciente-001',
  nombre: 'María López',
  email: 'maria.lopez@email.com',
  rol: 'paciente',
  pacienteId: 'paciente-001',
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<Usuario | null>(USUARIO_DOCTOR_DEMO);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  useEffect(() => {
    let activo = true;
    AsyncStorage.getItem(CLAVES_DATOS.usuarioActual)
      .then((guardado) => {
        if (!activo || !guardado) return;
        const usuario: unknown = JSON.parse(guardado);
        if (esUsuarioValido(usuario)) setUser(usuario);
        else console.warn('La sesión guardada no tiene un formato de usuario válido.');
      })
      .catch((error) => {
        console.warn('No se pudo recuperar la sesión local de prueba', error);
      })
      .finally(() => {
        if (activo) setCargandoAuth(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const guardarUsuario = useCallback(async (usuario: Usuario): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(CLAVES_DATOS.usuarioActual, JSON.stringify(usuario));
      setUser(usuario);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      Alert.alert(
        'No se pudo cambiar la vista',
        error instanceof Error ? error.message : 'No se pudo guardar la sesión de prueba.',
      );
      return false;
    }
  }, []);

  const iniciarComoDoctor = useCallback(
    () => guardarUsuario(USUARIO_DOCTOR_DEMO),
    [guardarUsuario],
  );

  const iniciarComoPaciente = useCallback(
    () => guardarUsuario(USUARIO_PACIENTE_DEMO),
    [guardarUsuario],
  );

  const iniciarSesion = useCallback(async (
    email: string,
    password: string,
  ): Promise<boolean> => {
    if (!password.trim()) return false;
    const correo = email.trim().toLowerCase();
    if (correo === USUARIO_DOCTOR_DEMO.email) {
      return iniciarComoDoctor();
    }
    if (correo === USUARIO_PACIENTE_DEMO.email) {
      return iniciarComoPaciente();
    }
    return false;
  }, [iniciarComoDoctor, iniciarComoPaciente]);

  const logout = useCallback(async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(CLAVES_DATOS.usuarioActual);
      setUser(null);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      Alert.alert(
        'No se pudo cerrar sesión',
        error instanceof Error ? error.message : 'No se pudo borrar la sesión guardada.',
      );
      return false;
    }
  }, []);

  const seleccionarRolDoctor = useCallback(
    async () => {
      await guardarUsuario(USUARIO_DOCTOR_DEMO);
    },
    [guardarUsuario],
  );

  const seleccionarPaciente = useCallback((paciente: Paciente) => {
    const usuario: Usuario = {
      id: paciente.id,
      nombre: paciente.nombre,
      email: paciente.correo ?? `${paciente.id}@odontoapp.local`,
      rol: 'paciente',
      pacienteId: paciente.id,
    };
    return guardarUsuario(usuario).then(() => undefined);
  }, [guardarUsuario]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      cargandoAuth,
      iniciarSesion,
      iniciarComoDoctor,
      iniciarComoPaciente,
      logout,
      seleccionarRolDoctor,
      seleccionarPaciente,
    }),
    [
      user,
      isAuthenticated,
      cargandoAuth,
      iniciarSesion,
      iniciarComoDoctor,
      iniciarComoPaciente,
      logout,
      seleccionarRolDoctor,
      seleccionarPaciente,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return contexto;
}

export function esRolUsuario(valor: unknown): valor is RolUsuario {
  return valor === 'doctor' || valor === 'paciente';
}

function esUsuarioValido(valor: unknown): valor is Usuario {
  if (typeof valor !== 'object' || valor === null) return false;
  const usuario = valor as Partial<Usuario>;
  return (
    typeof usuario.id === 'string' &&
    typeof usuario.nombre === 'string' &&
    typeof usuario.email === 'string' &&
    esRolUsuario(usuario.rol) &&
    (usuario.pacienteId === undefined || typeof usuario.pacienteId === 'string')
  );
}
