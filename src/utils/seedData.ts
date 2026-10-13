import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cita, Receta, Usuario } from '../types';
import { PACIENTES_INICIALES, Paciente } from '../types/paciente';

export const CLAVES_DATOS = {
  pacientes: '@OdontoApp:pacientes',
  citas: '@OdontoApp:citas',
  recetas: '@OdontoApp:recetas',
  usuarios: '@OdontoApp:usuarios',
  usuarioActual: '@OdontoApp:usuario_actual',
} as const;

export interface DatosPrueba {
  pacientes: Paciente[];
  citas: Cita[];
  recetas: Receta[];
  usuarios: Usuario[];
  usuarioActual: Usuario;
}

function fechaRelativa(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, '0'),
    String(fecha.getDate()).padStart(2, '0'),
  ].join('-');
}

export function crearDatosPrueba(): DatosPrueba {
  const pacientes: Paciente[] = JSON.parse(
    JSON.stringify(PACIENTES_INICIALES),
  ) as Paciente[];
  pacientes[0].correo = 'maria.lopez@example.test';
  pacientes[1].correo = 'juan.perez@example.test';
  pacientes[2].correo = 'ana.ramirez@example.test';

  const usuarios: Usuario[] = [
    {
      id: 'doctor-demo',
      nombre: 'Doctor (modo de prueba)',
      email: 'doctor@odontoapp.local',
      rol: 'doctor',
    },
    ...pacientes.map((paciente) => ({
      id: `usuario-${paciente.id}`,
      nombre: paciente.nombre,
      email: paciente.correo ?? `${paciente.id}@odontoapp.local`,
      rol: 'paciente' as const,
      pacienteId: paciente.id,
    })),
  ];

  const citas: Cita[] = [
    {
      id: 'cita-demo-001',
      pacienteId: pacientes[0].id,
      nombrePaciente: pacientes[0].nombre,
      fecha: fechaRelativa(2),
      hora: '09:30',
      motivoConsulta: 'Dolor en molar inferior derecho',
      tratamientoPrevisto: 'Valoración clínica y restauración',
      estatus: 'programada',
    },
    {
      id: 'cita-demo-002',
      pacienteId: pacientes[1].id,
      nombrePaciente: pacientes[1].nombre,
      fecha: fechaRelativa(5),
      hora: '11:00',
      motivoConsulta: 'Revisión de restauración',
      tratamientoPrevisto: 'Revisión y ajuste oclusal',
      estatus: 'pospuesta',
      notasAgenda: 'Cita de demostración para probar cambio de estado.',
    },
    {
      id: 'cita-demo-003',
      pacienteId: pacientes[2].id,
      nombrePaciente: pacientes[2].nombre,
      fecha: fechaRelativa(-7),
      hora: '13:15',
      motivoConsulta: 'Limpieza dental de rutina',
      tratamientoPrevisto: 'Profilaxis y revisión periodontal',
      estatus: 'completada',
    },
  ];

  const recetas: Receta[] = [
    {
      id: 'receta-demo-001',
      pacienteId: pacientes[0].id,
      fechaEmision: fechaRelativa(-1),
      diagnostico: 'Sensibilidad posterior a restauración dental',
      medicamentos: [
        {
          id: 'med-demo-001',
          nombre: 'Ibuprofeno',
          dosis: '400 mg',
          frecuencia: 'cada 8 horas, si hay dolor',
          duracion: '3 días',
          indicaciones: 'Tomar después de alimentos.',
        },
      ],
      indicacionesGenerales: 'Evitar alimentos muy fríos o calientes durante 24 horas.\nMantener higiene oral habitual.',
      estadoTratamiento: 'activo',
    },
    {
      id: 'receta-demo-002',
      pacienteId: pacientes[2].id,
      fechaEmision: fechaRelativa(-30),
      diagnostico: 'Molestia gingival leve',
      medicamentos: [],
      indicacionesGenerales: 'Usar cepillo de cerdas suaves y mantener higiene oral.',
      estadoTratamiento: 'completado',
    },
  ];

  return {
    pacientes,
    citas,
    recetas,
    usuarios,
    usuarioActual: usuarios[0],
  };
}

export async function initializeMockData(forzar = false): Promise<DatosPrueba | null> {
  const claves = Object.values(CLAVES_DATOS);
  const guardados = await AsyncStorage.multiGet(claves);
  const valores = new Map(guardados);
  const clavesPrincipales = [
    CLAVES_DATOS.pacientes,
    CLAVES_DATOS.citas,
    CLAVES_DATOS.recetas,
    CLAVES_DATOS.usuarioActual,
  ];
  const todasVacias = clavesPrincipales.every((clave) => !valores.get(clave));

  const datos = crearDatosPrueba();
  if (!forzar && !todasVacias) {
    const pacientesGuardados = valores.get(CLAVES_DATOS.pacientes);
    if (!pacientesGuardados) return null;

    const pacientesParseados: unknown = JSON.parse(pacientesGuardados);
    const idsIniciales = new Set(datos.pacientes.map((paciente) => paciente.id));
    const sonPacientesIniciales =
      Array.isArray(pacientesParseados) &&
      pacientesParseados.length === idsIniciales.size &&
      pacientesParseados.every(
        (paciente) =>
          typeof paciente === 'object' &&
          paciente !== null &&
          'id' in paciente &&
          typeof paciente.id === 'string' &&
          idsIniciales.has(paciente.id),
      );
    const clavesPorCompletar: [string, string][] = [];
    if (!valores.get(CLAVES_DATOS.usuarioActual)) {
      clavesPorCompletar.push([
        CLAVES_DATOS.usuarioActual,
        JSON.stringify(datos.usuarioActual),
      ]);
    }
    if (!valores.get(CLAVES_DATOS.usuarios)) {
      clavesPorCompletar.push([CLAVES_DATOS.usuarios, JSON.stringify(datos.usuarios)]);
    }
    if (sonPacientesIniciales) {
      for (const clave of [CLAVES_DATOS.citas, CLAVES_DATOS.recetas] as const) {
        const contenido = valores.get(clave);
        const valorParseado: unknown = contenido ? JSON.parse(contenido) : [];
        if (!Array.isArray(valorParseado) || valorParseado.length === 0) {
          const valor = clave === CLAVES_DATOS.citas ? datos.citas : datos.recetas;
          clavesPorCompletar.push([clave, JSON.stringify(valor)]);
        }
      }
    }
    if (clavesPorCompletar.length > 0) {
      await AsyncStorage.multiSet(clavesPorCompletar);
      return datos;
    }
    return null;
  }

  const valoresIniciales: [string, string][] = [
    [CLAVES_DATOS.pacientes, JSON.stringify(datos.pacientes)],
    [CLAVES_DATOS.citas, JSON.stringify(datos.citas)],
    [CLAVES_DATOS.recetas, JSON.stringify(datos.recetas)],
    [CLAVES_DATOS.usuarios, JSON.stringify(datos.usuarios)],
    [CLAVES_DATOS.usuarioActual, JSON.stringify(datos.usuarioActual)],
  ];

  await AsyncStorage.multiSet(valoresIniciales);
  return datos;
}
