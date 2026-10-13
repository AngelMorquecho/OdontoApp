import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  CARAS,
  CaraDental,
  crearOdontogramaVacio,
  Odontograma,
  TODOS_LOS_DIENTES,
} from '../components/types/odontograma';
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
  const factores = historiaClinica.factoresRiesgo;
  const antecedentesMedicos = historiaClinica.antecedentesMedicos;
  const exploracion = historiaClinica.exploracionClinica;
  const notas = Array.isArray(historiaClinica.notasEvolucion)
    ? historiaClinica.notasEvolucion.filter(esNotaEvolucionValida)
    : [];
  // Completa tanto secciones como objetos anidados para sanear respaldos previos o incompletos.
  return {
    identificacion: { ...base.identificacion, ...historiaClinica.identificacion },
    factoresRiesgo: {
      ...base.factoresRiesgo,
      ...factores,
      tabaquismo: { ...base.factoresRiesgo.tabaquismo, ...factores?.tabaquismo },
      alcohol: { ...base.factoresRiesgo.alcohol, ...factores?.alcohol },
      drogas: { ...base.factoresRiesgo.drogas, ...factores?.drogas },
      higieneOral: { ...base.factoresRiesgo.higieneOral, ...factores?.higieneOral },
    },
    antecedentesHeredofamiliares: {
      ...base.antecedentesHeredofamiliares,
      ...historiaClinica.antecedentesHeredofamiliares,
    },
    antecedentesMedicos: {
      ...base.antecedentesMedicos,
      ...antecedentesMedicos,
      alergias: { ...base.antecedentesMedicos.alergias, ...antecedentesMedicos?.alergias },
    },
    ginecoObstetricos: { ...base.ginecoObstetricos, ...historiaClinica.ginecoObstetricos },
    antecedentesOdontologicos: {
      ...base.antecedentesOdontologicos,
      ...historiaClinica.antecedentesOdontologicos,
    },
    signosVitales: { ...base.signosVitales, ...historiaClinica.signosVitales },
    exploracionClinica: {
      ...base.exploracionClinica,
      ...exploracion,
      extraoral: { ...base.exploracionClinica.extraoral, ...exploracion?.extraoral },
      intraoral: { ...base.exploracionClinica.intraoral, ...exploracion?.intraoral },
    },
    evaluacionPeriodontal: {
      ...base.evaluacionPeriodontal,
      ...historiaClinica.evaluacionPeriodontal,
    },
    diagnosticoPlan: { ...base.diagnosticoPlan, ...historiaClinica.diagnosticoPlan },
    notasEvolucion: notas,
  };
}

function esNotaEvolucionValida(valor: unknown): valor is NotaEvolucion {
  if (!valor || typeof valor !== 'object') return false;
  const nota = valor as Partial<NotaEvolucion>;
  const estudios = nota.estudios;
  return (
    typeof nota.id === 'string' &&
    typeof nota.fecha === 'string' &&
    typeof nota.hora === 'string' &&
    typeof nota.regionOD === 'string' &&
    typeof nota.evolucionProcedimiento === 'string' &&
    typeof nota.dx === 'string' &&
    (nota.pronostico === 'Favorable' ||
      nota.pronostico === 'Reservado' ||
      nota.pronostico === 'Desfavorable') &&
    typeof nota.plan === 'string' &&
    (nota.anestesia === 'si' || nota.anestesia === 'no') &&
    typeof nota.receta === 'string' &&
    typeof nota.indicaciones === 'string' &&
    typeof nota.proximaCita === 'string' &&
    typeof nota.tratante === 'string' &&
    !!estudios &&
    typeof estudios.rx === 'boolean' &&
    typeof estudios.fotos === 'boolean' &&
    typeof estudios.escaneo === 'boolean' &&
    typeof estudios.cbct === 'boolean'
  );
}

function sanearOdontograma(
  odontograma: Partial<Odontograma> | undefined,
  pacienteId: string,
): Odontograma {
  const base = crearOdontogramaVacio(pacienteId);
  const dientes = odontograma?.dientes;
  for (const numero of TODOS_LOS_DIENTES) {
    const diente = dientes?.[numero];
    if (!diente || typeof diente !== 'object') continue;
    const carasRecibidas = diente.caras;
    const caras: Partial<Record<CaraDental, unknown>> =
      carasRecibidas && typeof carasRecibidas === 'object' ? carasRecibidas : {};
    for (const cara of CARAS as readonly CaraDental[]) {
      const estado = caras[cara];
      if (estado === 'sana' || estado === 'caries' || estado === 'obturacion') {
        base.dientes[numero].caras[cara] = estado;
      }
    }
  }
  return {
    ...base,
    fecha: typeof odontograma?.fecha === 'string' ? odontograma.fecha : base.fecha,
    dientes: base.dientes,
  };
}

function esRadiografiaValida(valor: unknown): valor is Radiografia {
  if (!valor || typeof valor !== 'object') return false;
  const radiografia = valor as Partial<Radiografia>;
  return (
    typeof radiografia.id === 'string' &&
    typeof radiografia.uri === 'string' &&
    (radiografia.tipo === 'rx' || radiografia.tipo === 'foto') &&
    typeof radiografia.fecha === 'string' &&
    typeof radiografia.descripcion === 'string'
  );
}

function sanearPaciente(paciente: Partial<Paciente> & { id: string }): Paciente {
  return {
    id: paciente.id,
    nombre: paciente.nombre ?? '',
    edad: paciente.edad ?? 0,
    telefono: paciente.telefono ?? '',
    motivoConsulta: paciente.motivoConsulta ?? '',
    odontograma: sanearOdontograma(paciente.odontograma, paciente.id),
    historiaClinica: sanearHistoriaClinica(paciente.historiaClinica),
    radiografias: Array.isArray(paciente.radiografias)
      ? paciente.radiografias.filter(esRadiografiaValida)
      : [],
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
  reemplazarPacientes: (pacientesImportados: Paciente[]) => Promise<void>;
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

  const reemplazarPacientes = useCallback(
    async (pacientesImportados: Paciente[]) => {
      const pacientesSaneados = sanearPacientes(pacientesImportados);
      await AsyncStorage.setItem(
        CLAVE_ALMACENAMIENTO,
        JSON.stringify(pacientesSaneados),
      );
      setPacientes(pacientesSaneados);
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
        reemplazarPacientes,
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
