import React, { createContext, useContext, useMemo, useState } from 'react';
import { Paciente } from '../types/paciente';
import { RolUsuario, Usuario } from '../types';

interface AuthContextValue {
  user: Usuario;
  seleccionarRolDoctor: () => void;
  seleccionarPaciente: (paciente: Paciente) => void;
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

  const seleccionarRolDoctor = () => setUser(USUARIO_DOCTOR_DEMO);

  const seleccionarPaciente = (paciente: Paciente) => {
    setUser({
      id: paciente.id,
      nombre: paciente.nombre,
      email: paciente.correo ?? `${paciente.id}@odontoapp.local`,
      rol: 'paciente',
      pacienteId: paciente.id,
    });
  };

  const value = useMemo(
    () => ({ user, seleccionarRolDoctor, seleccionarPaciente }),
    [user],
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
