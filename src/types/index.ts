export * from './paciente';
export * from './database';

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

// 1. Agregado el rol 'ASISTENTE'
export type RolUsuario = 'SUPER_ADMIN' | 'DOCTOR' | 'PACIENTE' | 'ASISTENTE';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  doctorId?: string; // ID del doctor al que pertenece si es asistente
  pacienteId?: string;
}

export type EstadoSuscripcion = 'activa' | 'inactiva';

export interface CuentaDoctor {
  id: string;
  nombre: string;
  especialidad: string;
  cedula: string;
  email: string;
  suscripcion: EstadoSuscripcion;
  fechaAlta: string;
}

export type EstadoPlanTratamiento = 'en_proceso' | 'completado';
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

export interface AbonoTratamiento {
  id: string;
  monto: number;
  fecha: string;
  metodoPago: MetodoPago;
  concepto: string;
}

export interface TratamientoPaciente {
  id: string;
  doctorId: string;
  pacienteId: string;
  nombre: string;
  descripcion: string;
  costoTotal: number;
  estado: EstadoPlanTratamiento;
  fechaCreacion: string;
  abonos: AbonoTratamiento[];
}

// 2. Interfaz Perfil (representación de la tabla perfiles)
export interface Perfil {
  id: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  doctor_id?: string | null;
  cedula?: string | null;
  especialidad?: string | null;
}