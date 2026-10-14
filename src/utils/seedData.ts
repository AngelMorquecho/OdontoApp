import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cita, CuentaDoctor, Receta, Usuario } from '../types';
import {
  NotaEvolucion,
  PACIENTES_INICIALES,
  Paciente,
  Radiografia,
} from '../types/paciente';

export const CLAVES_DATOS = {
  pacientes: '@OdontoApp:pacientes',
  citas: '@OdontoApp:citas',
  recetas: '@OdontoApp:recetas',
  usuarios: '@OdontoApp:usuarios',
  doctores: '@OdontoApp:doctores',
  usuarioActual: '@OdontoApp:usuario_actual',
  notasEvolucion: '@notas_evolucion',
  galeriaPacientes: '@galeria_pacientes',
} as const;

export interface DatosPrueba {
  pacientes: Paciente[];
  citas: Cita[];
  recetas: Receta[];
  usuarios: Usuario[];
  doctores: CuentaDoctor[];
  usuarioActual: Usuario;
  notasEvolucion: Record<string, NotaEvolucion[]>;
  galeriaPacientes: Record<string, Radiografia[]>;
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
  pacientes.forEach((paciente) => {
    paciente.doctorId = 'doctor-demo-alejandro';
  });
  pacientes[0].correo = 'maria.lopez@example.test';
  pacientes[1].correo = 'juan.perez@example.test';
  pacientes[2].correo = 'ana.ramirez@example.test';

  const notasMaria: NotaEvolucion[] = [
    {
      id: 'nota-demo-maria-001',
      fecha: fechaRelativa(-10),
      hora: '10:20',
      regionOD: '36',
      evolucionProcedimiento:
        'Aislamiento relativo, eliminación selectiva de tejido cariado y restauración con resina compuesta fotopolimerizable.',
      dx: 'Caries dentinaria oclusal en órgano dentario 36.',
      pronostico: 'Favorable',
      plan: 'Control clínico de sensibilidad y revisión de la restauración en la siguiente cita.',
      anestesia: 'si',
      estudios: { rx: true, fotos: true, escaneo: false, cbct: false },
      receta: 'Ibuprofeno 400 mg cada 8 horas, solo en caso de dolor, por 3 días.',
      indicaciones: 'Evitar alimentos muy duros durante el resto del día y mantener higiene oral.',
      proximaCita: fechaRelativa(2),
      tratante: 'Dr. Luis Morquecho García',
    },
    {
      id: 'nota-demo-maria-002',
      fecha: fechaRelativa(-2),
      hora: '09:45',
      regionOD: '36',
      evolucionProcedimiento:
        'Revisión de restauración; ajuste oclusal conservador y pulido de superficies. La paciente refiere disminución de sensibilidad.',
      dx: 'Restauración oclusal en 36 íntegra, sin signos clínicos de filtración.',
      pronostico: 'Favorable',
      plan: 'Continuar observación y acudir a revisión si reaparece dolor espontáneo.',
      anestesia: 'no',
      estudios: { rx: false, fotos: true, escaneo: false, cbct: false },
      receta: '',
      indicaciones: 'Cepillado cuidadoso dos veces al día y uso diario de hilo dental.',
      proximaCita: fechaRelativa(90),
      tratante: 'Dra. Jacqueline Rodríguez Enríquez',
    },
  ];
  const galeriaMaria: Radiografia[] = [
    {
      id: 'media-demo-maria-rx-001',
      uri: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Abscessed_tooth_periapical_radiograph.jpg',
      tipo: 'rx',
      fecha: fechaRelativa(-10),
      descripcion: 'Radiografía periapical de OD 36. Fuente: Coronation Dental Specialty Group, Wikimedia Commons, CC BY-SA 3.0 (creativecommons.org/licenses/by-sa/3.0).',
    },
    {
      id: 'media-demo-maria-foto-001',
      uri: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=900&q=80',
      tipo: 'foto',
      fecha: fechaRelativa(-2),
      descripcion: 'Fotografía clínica intraoral posterior a restauración.',
    },
  ];
  pacientes[0].historiaClinica.notasEvolucion = notasMaria;
  pacientes[0].radiografias = galeriaMaria;

  const usuarios: Usuario[] = [
    {
      id: 'doctor-demo-alejandro',
      nombre: 'Doctor (modo de prueba)',
      email: 'doctor@odontoapp.local',
      rol: 'DOCTOR',
      doctorId: 'doctor-demo-alejandro',
    },
    ...pacientes.map((paciente) => ({
      id: `usuario-${paciente.id}`,
      nombre: paciente.nombre,
      email: paciente.correo ?? `${paciente.id}@odontoapp.local`,
      rol: 'PACIENTE' as const,
      pacienteId: paciente.id,
    })),
  ];
  const doctores: CuentaDoctor[] = [
    {
      id: 'doctor-demo-alejandro',
      nombre: 'Dr. Alejandro Morales',
      especialidad: 'Odontología general',
      cedula: '',
      email: 'doctor@dental.com',
      passwordTemporal: 'demo',
      suscripcion: 'activa',
      fechaVencimiento: fechaRelativa(365),
      fechaAlta: fechaRelativa(0),
    },
  ];

  const citas: Cita[] = [
    {
      id: 'cita-demo-001',
      doctorId: 'doctor-demo-alejandro',
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
      doctorId: 'doctor-demo-alejandro',
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
      doctorId: 'doctor-demo-alejandro',
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
      doctorId: 'doctor-demo-alejandro',
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
      doctorId: 'doctor-demo-alejandro',
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
    doctores,
    usuarioActual: usuarios[0],
    notasEvolucion: { [pacientes[0].id]: notasMaria },
    galeriaPacientes: { [pacientes[0].id]: galeriaMaria },
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
    CLAVES_DATOS.notasEvolucion,
    CLAVES_DATOS.galeriaPacientes,
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
    let pacientesActualizados: Paciente[] | null = null;
    if (sonPacientesIniciales && Array.isArray(pacientesParseados)) {
      pacientesActualizados = pacientesParseados as Paciente[];
      const pacienteMaria = pacientesActualizados.find(
        (paciente) => paciente.id === 'paciente-001',
      );
      const pacienteMariaSeed = datos.pacientes.find(
        (paciente) => paciente.id === 'paciente-001',
      );
      if (pacienteMaria && pacienteMariaSeed) {
        let actualizarMaria = false;
        if (!pacienteMaria.historiaClinica?.notasEvolucion?.length) {
          pacienteMaria.historiaClinica = {
            ...pacienteMariaSeed.historiaClinica,
            ...pacienteMaria.historiaClinica,
            notasEvolucion: pacienteMariaSeed.historiaClinica.notasEvolucion,
          };
          actualizarMaria = true;
        }
        if (!pacienteMaria.radiografias?.length) {
          pacienteMaria.radiografias = pacienteMariaSeed.radiografias;
          actualizarMaria = true;
        }
        if (actualizarMaria) {
          clavesPorCompletar.push([
            CLAVES_DATOS.pacientes,
            JSON.stringify(pacientesActualizados),
          ]);
        }
      }
    }
    if (!valores.get(CLAVES_DATOS.usuarioActual)) {
      clavesPorCompletar.push([
        CLAVES_DATOS.usuarioActual,
        JSON.stringify(datos.usuarioActual),
      ]);
    }
    if (!valores.get(CLAVES_DATOS.usuarios)) {
      clavesPorCompletar.push([CLAVES_DATOS.usuarios, JSON.stringify(datos.usuarios)]);
    }
    if (!valores.get(CLAVES_DATOS.doctores)) {
      clavesPorCompletar.push([CLAVES_DATOS.doctores, JSON.stringify(datos.doctores)]);
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
      if (!valores.get(CLAVES_DATOS.notasEvolucion)) {
        const notas = pacientesActualizados?.reduce<Record<string, NotaEvolucion[]>>(
          (acumuladas, paciente) => {
            const pacienteSeed = datos.pacientes.find((item) => item.id === paciente.id);
            const existentes = paciente.historiaClinica?.notasEvolucion ?? [];
            const notasPaciente =
              existentes.length > 0
                ? existentes
                : pacienteSeed?.historiaClinica.notasEvolucion ?? [];
            if (notasPaciente.length > 0) acumuladas[paciente.id] = notasPaciente;
            return acumuladas;
          },
          {},
        ) ?? {};
        clavesPorCompletar.push([
          CLAVES_DATOS.notasEvolucion,
          JSON.stringify(notas),
        ]);
      }
      if (!valores.get(CLAVES_DATOS.galeriaPacientes)) {
        const galeria = pacientesActualizados?.reduce<Record<string, Radiografia[]>>(
          (acumuladas, paciente) => {
            const pacienteSeed = datos.pacientes.find((item) => item.id === paciente.id);
            const imagenes =
              paciente.radiografias?.length
                ? paciente.radiografias
                : pacienteSeed?.radiografias ?? [];
            if (imagenes.length > 0) acumuladas[paciente.id] = imagenes;
            return acumuladas;
          },
          {},
        ) ?? {};
        clavesPorCompletar.push([
          CLAVES_DATOS.galeriaPacientes,
          JSON.stringify(galeria),
        ]);
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
    [CLAVES_DATOS.doctores, JSON.stringify(datos.doctores)],
    [CLAVES_DATOS.usuarioActual, JSON.stringify(datos.usuarioActual)],
    [CLAVES_DATOS.notasEvolucion, JSON.stringify(datos.notasEvolucion)],
    [CLAVES_DATOS.galeriaPacientes, JSON.stringify(datos.galeriaPacientes)],
  ];

  await AsyncStorage.multiSet(valoresIniciales);
  return datos;
}
