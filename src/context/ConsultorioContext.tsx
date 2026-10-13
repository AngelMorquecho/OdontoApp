import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

const CLAVE_CONSULTORIO = '@OdontoApp:consultorio';

export interface DatosConsultorio {
  nombreDoctor: string;
  cedula: string;
  direccion: string;
  telefono: string;
  nombreClinica: string;
}

export const DATOS_CONSULTORIO_INICIALES: DatosConsultorio = {
  nombreDoctor: 'Dr. Luis Morquecho García / Dra. Jacqueline Rodríguez Enríquez',
  cedula: '',
  direccion: '',
  telefono: '',
  nombreClinica: '',
};

function sanearDatosConsultorio(datos: unknown): DatosConsultorio {
  if (typeof datos !== 'object' || datos === null) {
    return DATOS_CONSULTORIO_INICIALES;
  }
  const recibidos = datos as Partial<DatosConsultorio>;
  return {
    nombreDoctor:
      typeof recibidos.nombreDoctor === 'string'
        ? recibidos.nombreDoctor
        : DATOS_CONSULTORIO_INICIALES.nombreDoctor,
    cedula: typeof recibidos.cedula === 'string' ? recibidos.cedula : '',
    direccion: typeof recibidos.direccion === 'string' ? recibidos.direccion : '',
    telefono: typeof recibidos.telefono === 'string' ? recibidos.telefono : '',
    nombreClinica: typeof recibidos.nombreClinica === 'string' ? recibidos.nombreClinica : '',
  };
}

interface ConsultorioContextValor {
  consultorio: DatosConsultorio;
  cargandoConsultorio: boolean;
  actualizarConsultorio: (datos: DatosConsultorio) => Promise<void>;
  restaurarConsultorio: (datos: DatosConsultorio) => Promise<void>;
}

const ConsultorioContext = createContext<ConsultorioContextValor | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

export function ConsultorioProvider({ children }: Props) {
  const [consultorio, setConsultorio] = useState<DatosConsultorio>(
    DATOS_CONSULTORIO_INICIALES,
  );
  const [cargandoConsultorio, setCargandoConsultorio] = useState(true);
  const huboActualizacion = useRef(false);

  useEffect(() => {
    let activo = true;
    AsyncStorage.getItem(CLAVE_CONSULTORIO)
      .then((guardado) => {
        if (!activo) return;
        if (guardado && !huboActualizacion.current) {
          setConsultorio(sanearDatosConsultorio(JSON.parse(guardado) as unknown));
        }
      })
      .catch((error) => {
        console.warn('No se pudieron leer los datos del consultorio', error);
      })
      .finally(() => {
        if (activo) setCargandoConsultorio(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const actualizarConsultorio = useCallback(async (datos: DatosConsultorio) => {
    await AsyncStorage.setItem(CLAVE_CONSULTORIO, JSON.stringify(datos));
    huboActualizacion.current = true;
    setConsultorio(datos);
  }, []);

  const restaurarConsultorio = actualizarConsultorio;

  return (
    <ConsultorioContext.Provider
      value={{
        consultorio,
        cargandoConsultorio,
        actualizarConsultorio,
        restaurarConsultorio,
      }}
    >
      {children}
    </ConsultorioContext.Provider>
  );
}

export function useConsultorio(): ConsultorioContextValor {
  const contexto = useContext(ConsultorioContext);
  if (!contexto) {
    throw new Error('useConsultorio debe usarse dentro de un ConsultorioProvider');
  }
  return contexto;
}
