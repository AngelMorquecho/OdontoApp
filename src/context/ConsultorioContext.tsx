import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';
import { guardarDatosConsultorio, obtenerDatosConsultorio } from '../services/clinicService';
import type { Usuario } from '../types';
import { useAuth } from './AuthContext';

export interface DatosConsultorio {
  nombreDoctor: string;
  cedula: string;
  direccion: string;
  telefono: string;
  nombreClinica: string;
}

export const DATOS_CONSULTORIO_INICIALES: DatosConsultorio = {
  nombreDoctor: '',
  cedula: '',
  direccion: '',
  telefono: '',
  nombreClinica: '',
};

interface ConsultorioContextValor {
  consultorio: DatosConsultorio;
  cargandoConsultorio: boolean;
  actualizarConsultorio: (datos: DatosConsultorio) => Promise<void>;
}

const ConsultorioContext = createContext<ConsultorioContextValor | undefined>(undefined);

export function ConsultorioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [consultorioCargado, setConsultorioCargado] = useState<{
    usuario: Usuario;
    datos: DatosConsultorio;
  } | null>(null);
  const cargandoConsultorio = user?.rol === 'DOCTOR' &&
    consultorioCargado?.usuario !== user;

  useEffect(() => {
    let activo = true;
    if (user?.rol !== 'DOCTOR') return;
    void obtenerDatosConsultorio()
      .then((datos) => {
        if (activo) setConsultorioCargado({
          usuario: user,
          datos: datos ?? { ...DATOS_CONSULTORIO_INICIALES, nombreDoctor: user.nombre },
        });
      })
      .catch((error: unknown) => {
        if (activo) {
          Alert.alert(
            'No se pudieron cargar los datos del consultorio',
            error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
          );
          setConsultorioCargado({
            usuario: user,
            datos: { ...DATOS_CONSULTORIO_INICIALES, nombreDoctor: user.nombre },
          });
        }
      });
    return () => {
      activo = false;
    };
  }, [user]);

  const actualizarConsultorio = useCallback(async (datos: DatosConsultorio) => {
    if (user?.rol !== 'DOCTOR') throw new Error('Solo un doctor puede guardar datos del consultorio.');
    await guardarDatosConsultorio(datos);
    setConsultorioCargado({ usuario: user, datos });
  }, [user]);

  const consultorio = useMemo(
    () => user?.rol === 'DOCTOR' && consultorioCargado?.usuario === user
      ? consultorioCargado.datos
      : {
          ...DATOS_CONSULTORIO_INICIALES,
          ...(user?.rol === 'DOCTOR' ? { nombreDoctor: user.nombre } : {}),
        },
    [consultorioCargado, user],
  );

  const value = useMemo(
    () => ({ consultorio, cargandoConsultorio, actualizarConsultorio }),
    [consultorio, cargandoConsultorio, actualizarConsultorio],
  );
  return <ConsultorioContext.Provider value={value}>{children}</ConsultorioContext.Provider>;
}

export function useConsultorio(): ConsultorioContextValor {
  const contexto = useContext(ConsultorioContext);
  if (!contexto) throw new Error('useConsultorio debe usarse dentro de un ConsultorioProvider');
  return contexto;
}
