import { crearOdontogramaVacio, Odontograma } from '../components/types/odontograma';

/** Respuesta binaria usada en varios campos clínicos. */
export type SiNo = 'si' | 'no';

/** Sexo biológico registrado en la identificación del paciente. */
export type Sexo = 'M' | 'F';

/** Calidad de la higiene oral autorreportada. */
export type NivelHigiene = 'buena' | 'regular' | 'mala';

/** Pronóstico clínico utilizado tanto en el plan general como en cada nota de evolución. */
export type Pronostico = 'Favorable' | 'Reservado' | 'Desfavorable';

// ---------- 1. Identificación ----------
export interface Identificacion {
  fechaNacimiento: string; // ISO 8601 (yyyy-mm-dd)
  sexo: Sexo;
  estadoCivil: string;
  domicilio: string;
  colonia: string;
  cp: string;
  ciudad: string;
  ocupacion: string;
  escolaridad: string;
  lugarResidencia: string;
}

// ---------- 2. Factores de riesgo ----------
export interface HabitoConsumo {
  consume: SiNo;
  frecuencia: string;
  tiempo: string;
}

export interface HigieneOral {
  frecuencia: string;
  calidad: NivelHigiene;
}

export interface FactoresRiesgo {
  tipoVivienda: string;
  zona: string;
  servicios: string;
  tabaquismo: HabitoConsumo;
  alcohol: HabitoConsumo;
  drogas: HabitoConsumo;
  higieneOral: HigieneOral;
}

// ---------- 3. Antecedentes heredofamiliares ----------
export interface AntecedentesHeredofamiliares {
  diabetes: SiNo;
  hipertension: SiNo;
  cardiopatias: SiNo;
  cancer: SiNo;
  especifique: string;
}

// ---------- 4. Antecedentes médicos personales ----------
export interface Alergias {
  medicamentos: SiNo;
  alimentos: SiNo;
  latex: SiNo;
  especifique: string;
}

export interface AntecedentesMedicos {
  diabetes: SiNo;
  hipertension: SiNo;
  asma: SiNo;
  epilepsia: SiNo;
  coagulacion: SiNo;
  renal: SiNo;
  hepatica: SiNo;
  tiroidea: SiNo;
  alergias: Alergias;
  medicamentosActuales: string;
  medicoTratante: string;
}

// ---------- 5. Antecedentes gineco-obstétricos ----------
export interface GinecoObstetricos {
  embarazada: SiNo;
  semanas: string;
  lactancia: SiNo;
  metodoAnticonceptivo: string;
}

// ---------- 6. Antecedentes odontológicos ----------
export interface AntecedentesOdontologicos {
  ultimaVisita: string;
  tratamientosPrevios: string;
  experienciaAnestesia: string;
}

// ---------- 7. Signos vitales ----------
export interface SignosVitales {
  ta: string; // tensión arterial, ej. "120/80"
  fc: string; // frecuencia cardiaca
  fr: string; // frecuencia respiratoria
  temperatura: string;
}

// ---------- 8. Exploración clínica ----------
export interface ExploracionExtraoral {
  cabezaCuello: string;
  atm: string;
  ganglios: string;
}

export interface ExploracionIntraoral {
  labios: string;
  encia: string;
  lengua: string;
  placa: string;
  calculo: string;
  relacionOclusal: string;
}

export interface ExploracionClinica {
  extraoral: ExploracionExtraoral;
  intraoral: ExploracionIntraoral;
}

// ---------- 9. Evaluación periodontal ----------
export interface EvaluacionPeriodontal {
  estadoPeriodontal: string;
  hallazgos: string;
}

// ---------- 10. Diagnóstico y plan de tratamiento ----------
export interface DiagnosticoPlan {
  diagnosticos: string;
  pronostico: Pronostico;
  planTratamiento: string;
  objetivoGeneral: string;
}

// ---------- 11. Notas de evolución ----------
export interface EstudiosComplementarios {
  rx: boolean;
  fotos: boolean;
  escaneo: boolean;
  cbct: boolean;
}

export interface NotaEvolucion {
  id: string;
  fecha: string; // ISO 8601 (yyyy-mm-dd)
  hora: string; // HH:mm
  regionOD: string; // región anatómica y/o número(s) FDI
  evolucionProcedimiento: string;
  dx: string;
  pronostico: Pronostico;
  plan: string;
  anestesia: SiNo;
  estudios: EstudiosComplementarios;
  receta: string;
  indicaciones: string;
  proximaCita: string;
  tratante: string;
}

/** Historia Clínica Odontológica completa, siguiendo el estándar clínico/NOM. */
export interface HistoriaClinica {
  identificacion: Identificacion;
  factoresRiesgo: FactoresRiesgo;
  antecedentesHeredofamiliares: AntecedentesHeredofamiliares;
  antecedentesMedicos: AntecedentesMedicos;
  ginecoObstetricos: GinecoObstetricos;
  antecedentesOdontologicos: AntecedentesOdontologicos;
  signosVitales: SignosVitales;
  exploracionClinica: ExploracionClinica;
  evaluacionPeriodontal: EvaluacionPeriodontal;
  diagnosticoPlan: DiagnosticoPlan;
  notasEvolucion: NotaEvolucion[];
}

/** Tipo de archivo multimedia clínico adjuntado al expediente. */
export type TipoRadiografia = 'rx' | 'foto';

/** Foto intraoral o radiografía adjunta al expediente del paciente. */
export interface Radiografia {
  id: string;
  uri: string;
  tipo: TipoRadiografia;
  fecha: string; // ISO 8601 (yyyy-mm-dd)
  descripcion: string;
}

/** Datos clínicos y de contacto de un paciente. */
export interface Paciente {
  id: string;
  doctorId?: string;
  nombre: string;
  edad: number;
  telefono: string;
  fechaNacimiento?: string;
  correo?: string;
  odontograma: Odontograma;
  historiaClinica: HistoriaClinica;
  radiografias: Radiografia[];
}

/** Crea una Historia Clínica vacía con valores por defecto, lista para capturarse. */
export function crearHistoriaClinicaVacia(): HistoriaClinica {
  return {
    identificacion: {
      fechaNacimiento: '',
      sexo: 'M',
      estadoCivil: '',
      domicilio: '',
      colonia: '',
      cp: '',
      ciudad: '',
      ocupacion: '',
      escolaridad: '',
      lugarResidencia: '',
    },
    factoresRiesgo: {
      tipoVivienda: '',
      zona: '',
      servicios: '',
      tabaquismo: { consume: 'no', frecuencia: '', tiempo: '' },
      alcohol: { consume: 'no', frecuencia: '', tiempo: '' },
      drogas: { consume: 'no', frecuencia: '', tiempo: '' },
      higieneOral: { frecuencia: '', calidad: 'regular' },
    },
    antecedentesHeredofamiliares: {
      diabetes: 'no',
      hipertension: 'no',
      cardiopatias: 'no',
      cancer: 'no',
      especifique: '',
    },
    antecedentesMedicos: {
      diabetes: 'no',
      hipertension: 'no',
      asma: 'no',
      epilepsia: 'no',
      coagulacion: 'no',
      renal: 'no',
      hepatica: 'no',
      tiroidea: 'no',
      alergias: { medicamentos: 'no', alimentos: 'no', latex: 'no', especifique: '' },
      medicamentosActuales: '',
      medicoTratante: '',
    },
    ginecoObstetricos: {
      embarazada: 'no',
      semanas: '',
      lactancia: 'no',
      metodoAnticonceptivo: '',
    },
    antecedentesOdontologicos: {
      ultimaVisita: '',
      tratamientosPrevios: '',
      experienciaAnestesia: '',
    },
    signosVitales: {
      ta: '',
      fc: '',
      fr: '',
      temperatura: '',
    },
    exploracionClinica: {
      extraoral: { cabezaCuello: '', atm: '', ganglios: '' },
      intraoral: {
        labios: '',
        encia: '',
        lengua: '',
        placa: '',
        calculo: '',
        relacionOclusal: '',
      },
    },
    evaluacionPeriodontal: {
      estadoPeriodontal: '',
      hallazgos: '',
    },
    diagnosticoPlan: {
      diagnosticos: '',
      pronostico: 'Favorable',
      planTratamiento: '',
      objetivoGeneral: '',
    },
    notasEvolucion: [],
  };
}

/** Mock inicial de 3 pacientes, cada uno con su propio odontograma vacío. */
export const PACIENTES_INICIALES: Paciente[] = [
  {
    id: 'paciente-001',
    nombre: 'María López',
    edad: 34,
    telefono: '+52 55 1234 5678',
    odontograma: crearOdontogramaVacio('paciente-001'),
    historiaClinica: crearHistoriaClinicaVacia(),
    radiografias: [],
  },
  {
    id: 'paciente-002',
    nombre: 'Juan Carlos Pérez',
    edad: 47,
    telefono: '+52 55 2345 6789',
    odontograma: crearOdontogramaVacio('paciente-002'),
    historiaClinica: crearHistoriaClinicaVacia(),
    radiografias: [],
  },
  {
    id: 'paciente-003',
    nombre: 'Ana Sofía Ramírez',
    edad: 22,
    telefono: '+52 55 3456 7890',
    odontograma: crearOdontogramaVacio('paciente-003'),
    historiaClinica: crearHistoriaClinicaVacia(),
    radiografias: [],
  },
];
