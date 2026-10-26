import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";
import type { Odontograma } from "../components/types/odontograma";
import {
  type AbonoTratamiento,
  type Cita,
  type EstadoTratamiento,
  type Receta,
  type TratamientoPaciente,
} from "../types";
import {
  type HistoriaClinica,
  type NotaEvolucion,
  type Paciente,
  type Radiografia,
} from "../types/paciente";
import { useAuth } from "./AuthContext";
import {
  actualizarEstatusCita,
  crearCita as insertarCita,
  listarCitas,
} from "../services/appointmentService";
import { guardarHistoriaClinica } from "../services/clinicalHistoryService";
import { crearNotaEvolucion } from "../services/evolutionNotesService";
import {
  actualizarPaciente as guardarPaciente,
  crearPaciente as insertarPaciente,
  listarPacientes,
} from "../services/patientService";
import {
  actualizarReceta,
  crearReceta as insertarReceta,
  listarRecetas,
} from "../services/recipeService";
import {
  crearTratamiento as insertarTratamiento,
  listarTratamientos,
  registrarAbono as insertarAbono,
} from "../services/paymentService";
import {
  eliminarRadiografia,
  guardarMetaArchivo,
  subirRadiografia,
} from "../services/storageService";

export type NuevoPaciente = Pick<Paciente, "nombre" | "edad" | "telefono"> &
  Partial<Pick<Paciente, "fechaNacimiento" | "correo">>;

interface PacientesContextValor {
  pacientes: Paciente[];
  citas: Cita[];
  recetas: Receta[];
  tratamientos: TratamientoPaciente[];
  cargandoCitas: boolean;
  cargandoRecetas: boolean;
  cargando: boolean;
  getCitas: () => Cita[];
  crearCita: (cita: Cita) => Promise<void>;
  cambiarEstatusCita: (
    id: string,
    nuevoEstatus: Cita["estatus"],
  ) => Promise<void>;
  getRecetasPaciente: (pacienteId: string) => Receta[];
  crearReceta: (receta: Receta) => Promise<void>;
  actualizarEstadoTratamiento: (
    recetaId: string,
    estado: EstadoTratamiento,
  ) => Promise<void>;
  getTratamientosPaciente: (pacienteId: string) => TratamientoPaciente[];
  crearTratamiento: (
    tratamiento: Omit<
      TratamientoPaciente,
      "id" | "doctorId" | "fechaCreacion" | "abonos"
    >,
  ) => Promise<void>;
  registrarAbono: (
    tratamientoId: string,
    abono: Omit<AbonoTratamiento, "id">,
  ) => Promise<void>;
  obtenerPaciente: (id: string) => Paciente | undefined;
  agregarPaciente: (datos: NuevoPaciente) => Promise<Paciente>;
  actualizarOdontograma: (
    pacienteId: string,
    odontograma: Odontograma,
  ) => Promise<void>;
  actualizarHistoriaClinica: (
    pacienteId: string,
    historiaClinica: HistoriaClinica,
  ) => Promise<void>;
  agregarNotaEvolucion: (
    pacienteId: string,
    nota: NotaEvolucion,
  ) => Promise<void>;
  agregarRadiografia: (
    pacienteId: string,
    imagen: Radiografia,
  ) => Promise<void>;
}

const PacientesContext = createContext<PacientesContextValor | undefined>(
  undefined,
);

interface Props {
  children: React.ReactNode;
}

function textoError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

export function PacientesProvider({ children }: Props) {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [tratamientos, setTratamientos] = useState<TratamientoPaciente[]>([]);
  const [datosDeUsuario, setDatosDeUsuario] = useState<typeof user>(null);

  // Identificador principal del consultorio
  const doctorId =
    user?.rol === "DOCTOR"
      ? (user.doctorId ?? user.id)
      : user?.rol === "ASISTENTE"
        ? user.doctorId
        : undefined;

  const cargando =
    !!user && user.rol !== "SUPER_ADMIN" && datosDeUsuario !== user;

  // Unico useEffect desacoplado e inmune a fallos en sub-consultas
  useEffect(() => {
    let activo = true;
    if (!user || user.rol === "SUPER_ADMIN") return;

    // 1. Pacientes (Inmune)
    listarPacientes()
      .then((data) => {
        if (activo) setPacientes(data);
      })
      .catch((err) => console.error("Error cargando pacientes:", err));

    // 2. Citas
    listarCitas()
      .then((data) => {
        if (activo) setCitas(data);
      })
      .catch((err) => console.warn("Error cargando citas:", err));

    // 3. Recetas
    listarRecetas()
      .then((data) => {
        if (activo) setRecetas(data);
      })
      .catch((err) => console.warn("Error cargando recetas:", err));

    // 4. Tratamientos
    listarTratamientos()
      .then((data) => {
        if (activo) setTratamientos(data);
      })
      .catch((err) => console.warn("Error cargando tratamientos:", err));

    setDatosDeUsuario(user);

    return () => {
      activo = false;
    };
  }, [user]);

  // Visualización compartida de Pacientes (Doctor y Asistente ven todo el consultorio)
  const pacientesVisibles = useMemo(() => {
    if (!user) return [];

    if (user.rol === "PACIENTE") {
      return pacientes.filter((paciente) => paciente.id === user.pacienteId);
    }

    if (user.rol === "DOCTOR" || user.rol === "ASISTENTE") {
      return pacientes; // La RLS y la consulta de Supabase ya traen los del doctor y asistente
    }

    return [];
  }, [pacientes, user]);

  // Visualización compartida de Citas
  const citasVisibles = useMemo(() => {
    if (!user) return [];

    if (user.rol === "PACIENTE") {
      return citas.filter((cita) => cita.pacienteId === user.pacienteId);
    }

    if (user.rol === "DOCTOR" || user.rol === "ASISTENTE") {
      return citas;
    }

    return [];
  }, [citas, user]);

  // Visualización compartida de Recetas
  const recetasVisibles = useMemo(() => {
    if (!user) return [];

    if (user.rol === "PACIENTE") {
      return recetas.filter((receta) => receta.pacienteId === user.pacienteId);
    }

    if (user.rol === "DOCTOR" || user.rol === "ASISTENTE") {
      return recetas;
    }

    return [];
  }, [recetas, user]);

  // Visualización compartida de Tratamientos
  const tratamientosVisibles = useMemo(() => {
    if (!user) return [];

    if (user.rol === "PACIENTE") {
      return tratamientos.filter((item) => item.pacienteId === user.pacienteId);
    }

    if (user.rol === "DOCTOR" || user.rol === "ASISTENTE") {
      return tratamientos;
    }

    return [];
  }, [tratamientos, user]);

  const obtenerPaciente = useCallback(
    (id: string) => pacientesVisibles.find((paciente) => paciente.id === id),
    [pacientesVisibles],
  );

  const getRecetasPaciente = useCallback(
    (pacienteId: string) =>
      recetasVisibles.filter((receta) => receta.pacienteId === pacienteId),
    [recetasVisibles],
  );

  const getTratamientosPaciente = useCallback(
    (pacienteId: string) =>
      tratamientosVisibles
        .filter((tratamiento) => tratamiento.pacienteId === pacienteId)
        .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion)),
    [tratamientosVisibles],
  );

  const agregarPaciente = useCallback(
    async (datos: NuevoPaciente) => {
      if (user?.rol !== "DOCTOR" && user?.rol !== "ASISTENTE")
        throw new Error("No tienes permisos para dar de alta pacientes.");
      const nuevo = await insertarPaciente(datos);
      setPacientes((actuales) => [...actuales, nuevo]);
      return nuevo;
    },
    [user?.rol],
  );

  const crearCita = useCallback(
    async (cita: Cita) => {
      if (user?.rol !== "DOCTOR" && user?.rol !== "ASISTENTE")
        throw new Error("No tienes permisos para agendar citas.");
      const nueva = await insertarCita(cita);
      setCitas((actuales) =>
        [...actuales, nueva].sort((a, b) =>
          `${a.fecha}T${a.hora}`.localeCompare(`${b.fecha}T${b.hora}`),
        ),
      );
    },
    [user?.rol],
  );

  const cambiarEstatusCita = useCallback(
    async (citaId: string, nuevoEstatus: Cita["estatus"]) => {
      if (
        user?.rol !== "DOCTOR" &&
        user?.rol !== "ASISTENTE" &&
        user?.rol !== "PACIENTE"
      ) {
        throw new Error(
          "El perfil actual no tiene permisos para actualizar el estado de la cita.",
        );
      }

      await actualizarEstatusCita(citaId, nuevoEstatus);

      setCitas((actuales) =>
        actuales.map((cita) =>
          cita.id === citaId ? { ...cita, estatus: nuevoEstatus } : cita,
        ),
      );
    },
    [user?.rol],
  );

  const crearReceta = useCallback(
    async (receta: Receta) => {
      if (user?.rol !== "DOCTOR" && user?.rol !== "ASISTENTE")
        throw new Error("No tienes permisos para emitir recetas.");
      const nueva = await insertarReceta(receta);
      setRecetas((actuales) => [nueva, ...actuales]);
    },
    [user?.rol],
  );

  const actualizarEstadoTratamiento = useCallback(
    async (recetaId: string, estado: EstadoTratamiento) => {
      const receta = recetasVisibles.find((item) => item.id === recetaId);
      if (!receta) throw new Error("No se encontró la receta seleccionada.");
      await actualizarReceta({ ...receta, estadoTratamiento: estado });
      setRecetas((actuales) =>
        actuales.map((receta) =>
          receta.id === recetaId
            ? { ...receta, estadoTratamiento: estado }
            : receta,
        ),
      );
    },
    [recetasVisibles],
  );

  const crearTratamiento = useCallback(
    async (
      tratamiento: Omit<
        TratamientoPaciente,
        "id" | "doctorId" | "fechaCreacion" | "abonos"
      >,
    ) => {
      if (user?.rol !== "DOCTOR" && user?.rol !== "ASISTENTE")
        throw new Error("No tienes permisos para registrar tratamientos.");
      const nuevo = await insertarTratamiento(tratamiento);
      setTratamientos((actuales) => [nuevo, ...actuales]);
    },
    [user?.rol],
  );

  const registrarAbono = useCallback(
    async (tratamientoId: string, abono: Omit<AbonoTratamiento, "id">) => {
      const tratamiento = tratamientosVisibles.find(
        (item) => item.id === tratamientoId,
      );
      if (!tratamiento)
        throw new Error("No se encontró el tratamiento seleccionado.");
      const nuevo = await insertarAbono(tratamientoId, abono);
      setTratamientos((actuales) =>
        actuales.map((item) =>
          item.id === tratamientoId
            ? { ...item, abonos: [...item.abonos, nuevo] }
            : item,
        ),
      );
    },
    [tratamientosVisibles],
  );

  const actualizarOdontograma = useCallback(
    async (pacienteId: string, odontograma: Odontograma) => {
      const paciente = obtenerPaciente(pacienteId);
      if ((user?.rol !== "DOCTOR" && user?.rol !== "ASISTENTE") || !paciente) return;
      const actualizado = { ...paciente, odontograma };
      try {
        await guardarPaciente(actualizado);
        setPacientes((actuales) =>
          actuales.map((item) => (item.id === pacienteId ? actualizado : item)),
        );
      } catch (error) {
        Alert.alert("No se pudo guardar el odontograma", textoError(error));
      }
    },
    [obtenerPaciente, user?.rol],
  );

  const actualizarHistoriaClinica = useCallback(
    async (pacienteId: string, historiaClinica: HistoriaClinica) => {
      if (user?.rol !== "DOCTOR" && user?.rol !== "ASISTENTE") return;
      try {
        await guardarHistoriaClinica(pacienteId, historiaClinica);
        const paciente = obtenerPaciente(pacienteId);
        if (paciente) {
          setPacientes((actuales) =>
            actuales.map((item) =>
              item.id === pacienteId ? { ...item, historiaClinica } : item,
            ),
          );
        }
      } catch (error) {
        throw error;
      }
    },
    [obtenerPaciente, user?.rol],
  );

  const agregarNotaEvolucion = useCallback(
    async (pacienteId: string, nota: NotaEvolucion) => {
      if (user?.rol !== "DOCTOR" && user?.rol !== "ASISTENTE")
        throw new Error("No tienes permisos para agregar notas clínicas.");
      const guardada = await crearNotaEvolucion(pacienteId, nota);
      setPacientes((actuales) =>
        actuales.map((paciente) =>
          paciente.id === pacienteId
            ? {
                ...paciente,
                historiaClinica: {
                  ...paciente.historiaClinica,
                  notasEvolucion: [
                    guardada,
                    ...(paciente.historiaClinica?.notasEvolucion ?? []),
                  ],
                },
              }
            : paciente,
        ),
      );
    },
    [user?.rol],
  );

  const agregarRadiografia = useCallback(
    async (pacienteId: string, imagen: Radiografia) => {
      if ((user?.rol !== "DOCTOR" && user?.rol !== "ASISTENTE") || !doctorId) {
        throw new Error(
          "No se pudo validar el consultorio para adjuntar imágenes.",
        );
      }

      const paciente = obtenerPaciente(pacienteId);
      if (!paciente) {
        throw new Error("No se encontró el paciente seleccionado.");
      }

      const subida = await subirRadiografia(doctorId, pacienteId, imagen.uri);

      try {
        const nuevaImagenRegistrada = await guardarMetaArchivo(
          pacienteId,
          imagen.tipo || "Fotografía",
          imagen.descripcion || imagen.notas || "",
          subida.storagePath,
        );

        setPacientes((actuales) =>
          actuales.map((item) =>
            item.id === pacienteId
              ? {
                  ...item,
                  radiografias: [nuevaImagenRegistrada, ...(item.radiografias ?? [])],
                }
              : item,
          ),
        );
      } catch (error) {
        try {
          await eliminarRadiografia({ uri: subida.uri, storagePath: subida.storagePath } as Radiografia);
        } catch (cleanupError) {
          console.error(
            "No se pudo limpiar la imagen después del fallo al guardar el expediente.",
            cleanupError,
          );
        }
        throw error;
      }
    },
    [doctorId, obtenerPaciente, user?.rol],
  );

  const value = useMemo<PacientesContextValor>(
    () => ({
      pacientes: pacientesVisibles,
      citas: citasVisibles,
      recetas: recetasVisibles,
      tratamientos: tratamientosVisibles,
      cargandoCitas: cargando,
      cargandoRecetas: cargando,
      cargando,
      getCitas: () => citasVisibles,
      crearCita,
      cambiarEstatusCita,
      getRecetasPaciente,
      crearReceta,
      actualizarEstadoTratamiento,
      getTratamientosPaciente,
      crearTratamiento,
      registrarAbono,
      obtenerPaciente,
      agregarPaciente,
      actualizarOdontograma,
      actualizarHistoriaClinica,
      agregarNotaEvolucion,
      agregarRadiografia,
    }),
    [
      pacientesVisibles,
      citasVisibles,
      recetasVisibles,
      tratamientosVisibles,
      cargando,
      crearCita,
      cambiarEstatusCita,
      getRecetasPaciente,
      crearReceta,
      actualizarEstadoTratamiento,
      getTratamientosPaciente,
      crearTratamiento,
      registrarAbono,
      obtenerPaciente,
      agregarPaciente,
      actualizarOdontograma,
      actualizarHistoriaClinica,
      agregarNotaEvolucion,
      agregarRadiografia,
    ],
  );

  return (
    <PacientesContext.Provider value={value}>
      {children}
    </PacientesContext.Provider>
  );
}

export function usePacientes(): PacientesContextValor {
  const contexto = useContext(PacientesContext);
  if (!contexto)
    throw new Error("usePacientes debe usarse dentro de un PacientesProvider");
  return contexto;
}