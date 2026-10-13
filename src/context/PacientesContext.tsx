import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { crearOdontogramaVacio, Odontograma } from '../components/types/odontograma';
import {
  crearHistoriaClinicaVacia,
  HistoriaClinica,
  NotaEvolucion,
  Paciente,
  Radiografia,
  PACIENTES_INICIALES,
} from '../types/paciente';

const CLAVE_ALMACENAMIENTO = '@OdontoApp:pacientes';

/**
 * Completa campos que pudieran faltar en pacientes guardados con una versión
 * anterior de la app (por ejemplo, antes de que existiera `historiaClinica`
 * o `radiografias`). Evita que la UI truene con "Cannot read properties of
 * undefined" al leer datos persistidos desde una versión previa del esquema.
 */
function sanearHistoriaClinica(
  historiaClinica: Partial<HistoriaClinica> | undefined,
): HistoriaClinica {
  const base = crearHistoriaClinicaVacia();
  if (!historiaClinica) return base;
  // Merge superficial por sección + fallback de notasEvolucion como arreglo,
  // por si el objeto persistido viene de un esquema previo incompleto.
  return {
    identificacion: { ...base.identificacion, ...historiaClinica.identificacion },
    factoresRiesgo: { ...base.factoresRiesgo, ...historiaClinica.factoresRiesgo },
    antecedentesHeredofamiliares: {
      ...base.antecedentesHeredofamiliares,
      ...historiaClinica.antecedentesHeredofamiliares,
    },
    antecedentesMedicos: { ...base.antecedentesMedicos, ...historiaClinica.antecedentesMedicos },
    ginecoObstetricos: { ...base.ginecoObstetricos, ...historiaClinica.ginecoObstetricos },
    antecedentesOdontologicos: {
      ...base.antecedentesOdontologicos,
      ...historiaClinica.antecedentesOdontologicos,
    },
    signosVitales: { ...base.signosVitales, ...historiaClinica.signosVitales },
    exploracionClinica: { ...base.exploracionClinica, ...historiaClinica.exploracionClinica },
    evaluacionPeriodontal: {
      ...base.evaluacionPeriodontal,
      ...historiaClinica.evaluacionPeriodontal,
    },
    diagnosticoPlan: { ...base.diagnosticoPlan, ...historiaClinica.diagnosticoPlan },
    notasEvolucion: historiaClinica.notasEvolucion ?? [],
  };
}

function sanearPaciente(paciente: Partial<Paciente> & { id: string }): Paciente {
  return {
    id: paciente.id,
    nombre: paciente.nombre ?? '',
    edad: paciente.edad ?? 0,
    telefono: paciente.telefono ?? '',
    motivoConsulta: paciente.motivoConsulta ?? '',
    odontograma: paciente.odontograma ?? crearOdontogramaVacio(paciente.id),
    historiaClinica: sanearHistoriaClinica(paciente.historiaClinica),
    radiografias: paciente.radiografias ?? [],
  };
}

function sanearPacientes(pacientes: (Partial<Paciente> & { id: string })[]): Paciente[] {
  return pacientes.map(sanearPaciente);
}

/** Datos que el usuario captura al dar de alta un paciente nuevo. */
export type NuevoPaciente = Pick<
  Paciente,
  'nombre' | 'edad' | 'telefono' | 'motivoConsulta'
>;

interface PacientesContextValor {
  pacientes: Paciente[];
  /** true mientras se recupera la lista guardada en AsyncStorage. */
  cargando: boolean;
  obtenerPaciente: (id: string) => Paciente | undefined;
  agregarPaciente: (datos: NuevoPaciente) => Promise<Paciente>;
  actualizarOdontograma: (
    pacienteId: string,
    odontograma: Odontograma,
  ) => void;
  actualizarHistoriaClinica: (
    pacienteId: string,
    historiaClinica: HistoriaClinica,
  ) => void;
  agregarNotaEvolucion: (
    pacienteId: string,
    nuevaNota: NotaEvolucion,
  ) => void;
  agregarRadiografia: (
    pacienteId: string,
    nuevaRadiografia: Radiografia,
  ) => void;
  /** Borra por completo la lista de pacientes del dispositivo y reinicia con el mock. */
  limpiarAlmacenamiento: () => Promise<void>;
}

const PacientesContext = createContext<PacientesContextValor | undefined>(
  undefined,
);

interface Props {
  children: React.ReactNode;
}

export function PacientesProvider({ children }: Props) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  // Evita que el efecto de guardado se dispare con el array vacío inicial,
  // antes de que termine de leerse el valor persistido.
  const cargaInicialCompleta = useRef(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const guardado = await AsyncStorage.getItem(CLAVE_ALMACENAMIENTO);
        if (!activo) return;
        if (guardado) {
          const datosCrudos = JSON.parse(guardado) as (Partial<Paciente> & {
            id: string;
          })[];
          // Sanea cualquier paciente persistido con un esquema previo
          // (sin historiaClinica/radiografias) para evitar errores de
          // "Cannot read properties of undefined" en el renderizado.
          const pacientesSaneados = sanearPacientes(datosCrudos);
          setPacientes(pacientesSaneados);
        } else {
          setPacientes(PACIENTES_INICIALES);
          await AsyncStorage.setItem(
            CLAVE_ALMACENAMIENTO,
            JSON.stringify(PACIENTES_INICIALES),
          );
        }
      } catch (error) {
        console.warn(
          'No se pudo leer la lista de pacientes desde el almacenamiento local',
          error,
        );
        if (activo) setPacientes(PACIENTES_INICIALES);
      } finally {
        if (activo) {
          cargaInicialCompleta.current = true;
          setCargando(false);
        }
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!cargaInicialCompleta.current) return;
    AsyncStorage.setItem(
      CLAVE_ALMACENAMIENTO,
      JSON.stringify(pacientes),
    ).catch((error) => {
      console.warn(
        'No se pudo guardar la lista de pacientes en el almacenamiento local',
        error,
      );
    });
  }, [pacientes]);

  const obtenerPaciente = useCallback(
    (id: string) => pacientes.find((p) => p.id === id),
    [pacientes],
  );

  const agregarPaciente = useCallback(
    async (datos: NuevoPaciente): Promise<Paciente> => {
      const id = `paciente-${Date.now()}`;
      const nuevo: Paciente = {
        id,
        ...datos,
        odontograma: crearOdontogramaVacio(id),
        historiaClinica: crearHistoriaClinicaVacia(),
        radiografias: [],
      };
      setPacientes((anteriores) => [...anteriores, nuevo]);
      return nuevo;
    },
    [],
  );

  const actualizarOdontograma = useCallback(
    (pacienteId: string, odontograma: Odontograma) => {
      setPacientes((anteriores) =>
        anteriores.map((p) =>
          p.id === pacienteId ? { ...p, odontograma } : p,
        ),
      );
    },
    [],
  );

  const actualizarHistoriaClinica = useCallback(
    (pacienteId: string, historiaClinica: HistoriaClinica) => {
      setPacientes((anteriores) =>
        anteriores.map((p) =>
          p.id === pacienteId ? { ...p, historiaClinica } : p,
        ),
      );
    },
    [],
  );

  const agregarNotaEvolucion = useCallback(
    (pacienteId: string, nuevaNota: NotaEvolucion) => {
      setPacientes((anteriores) =>
        anteriores.map((p) => {
          if (p.id !== pacienteId) return p;
          // Optional chaining + fallback: por si el paciente en memoria
          // viniera sin historiaClinica (dato corrupto o esquema previo).
          const historiaClinica = p.historiaClinica ?? crearHistoriaClinicaVacia();
          return {
            ...p,
            historiaClinica: {
              ...historiaClinica,
              notasEvolucion: [...(historiaClinica.notasEvolucion ?? []), nuevaNota],
            },
          };
        }),
      );
    },
    [],
  );

  const agregarRadiografia = useCallback(
    (pacienteId: string, nuevaRadiografia: Radiografia) => {
      setPacientes((anteriores) =>
        anteriores.map((p) =>
          p.id === pacienteId
            ? { ...p, radiografias: [...(p.radiografias ?? []), nuevaRadiografia] }
            : p,
        ),
      );
    },
    [],
  );

  const limpiarAlmacenamiento = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(CLAVE_ALMACENAMIENTO);
    } catch (error) {
      console.warn('No se pudo limpiar el almacenamiento local', error);
    } finally {
      setPacientes(PACIENTES_INICIALES);
    }
  }, []);

  return (
    <PacientesContext.Provider
      value={{
        pacientes,
        cargando,
        obtenerPaciente,
        agregarPaciente,
        actualizarOdontograma,
        actualizarHistoriaClinica,
        agregarNotaEvolucion,
        agregarRadiografia,
        limpiarAlmacenamiento,
      }}
    >
      {children}
    </PacientesContext.Provider>
  );
}

/** Hook de acceso al contexto. Debe usarse dentro de <PacientesProvider>. */
export function usePacientes(): PacientesContextValor {
  const contexto = useContext(PacientesContext);
  if (!contexto) {
    throw new Error('usePacientes debe usarse dentro de un PacientesProvider');
  }
  return contexto;
}
