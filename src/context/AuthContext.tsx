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
  user: Usuario;
  cargandoAuth: boolean;
  seleccionarRolDoctor: () => Promise<void>;
  seleccionarPaciente: (paciente: Paciente) => Promise<void>;
}

const USUARIO_DOCTOR_DEMO: Usuario = {
  id: 'doctor-demo',
  nombre: 'Doctor (modo de prueba)',
  email: 'doctor@odontoapp.local',
  rol: 'doctor',
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<Usuario>(USUARIO_DOCTOR_DEMO);
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

  const guardarUsuario = useCallback(async (usuario: Usuario) => {
    try {
      await AsyncStorage.setItem(CLAVES_DATOS.usuarioActual, JSON.stringify(usuario));
      setUser(usuario);
    } catch (error) {
      Alert.alert(
        'No se pudo cambiar la vista',
        error instanceof Error ? error.message : 'No se pudo guardar la sesión de prueba.',
      );
    }
  }, []);

  const seleccionarRolDoctor = useCallback(
    () => guardarUsuario(USUARIO_DOCTOR_DEMO),
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
    return guardarUsuario(usuario);
  }, [guardarUsuario]);

  const value = useMemo(
    () => ({ user, cargandoAuth, seleccionarRolDoctor, seleccionarPaciente }),
    [user, cargandoAuth, seleccionarRolDoctor, seleccionarPaciente],
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
