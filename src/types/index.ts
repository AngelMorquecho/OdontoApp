export * from './paciente';

export type EstatusCita =
  | 'programada'
  | 'confirmada'
  | 'pospuesta'
  | 'completada'
  | 'cancelada';

export interface Cita {
  id: string;
  doctorId?: string;
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
  doctorId?: string;
  pacienteId: string;
  fechaEmision: string;
  diagnostico: string;
  medicamentos: Medicamento[];
  indicacionesGenerales: string;
  estadoTratamiento: EstadoTratamiento;
}

export type RolUsuario = 'SUPER_ADMIN' | 'DOCTOR' | 'PACIENTE';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  doctorId?: string;
  pacienteId?: string;
}

export type EstadoSuscripcion = 'activa' | 'inactiva';

export interface CuentaDoctor {
  id: string;
  nombre: string;
  especialidad: string;
  cedula: string;
  email: string;
  passwordTemporal: string;
  suscripcion: EstadoSuscripcion;
  limitePacientes?: number;
  fechaVencimiento: string;
  fechaAlta: string;
}
