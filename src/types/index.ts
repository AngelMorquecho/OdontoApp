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
