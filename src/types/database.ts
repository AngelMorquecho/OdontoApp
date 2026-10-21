export type RolPerfil = 'SUPER_ADMIN' | 'DOCTOR' | 'PACIENTE'| 'ASISTENTE';

export interface PerfilDatabase {
  id: string;
  email: string;
  nombre: string;
  rol: RolPerfil;
  cedula?: string | null;
  especialidad?: string | null;
  logo_url?: string | null;
  suscripcion_estado?: string | null;
  created_at: string;
}
