export * from './paciente';

export type EstatusCita =
  | 'programada'
  | 'pospuesta'
  | 'completada'
  | 'cancelada';

export interface Cita {
  id: string;
  pacienteId: string;
  nombrePaciente: string;
  fecha: string;
  hora: string;
  motivoConsulta: string;
  tratamientoPrevisto: string;
  estatus: EstatusCita;
  notasAgenda?: string;
}

export interface Medicamento {
  id: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicaciones: string;
}

export type EstadoTratamiento = 'activo' | 'completado';

export interface Receta {
  id: string;
  pacienteId: string;
  fechaEmision: string;
  diagnostico: string;
  medicamentos: Medicamento[];
  indicacionesGenerales: string;
  estadoTratamiento: EstadoTratamiento;
}
