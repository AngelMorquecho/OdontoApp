import type { CuentaDoctor } from '../types';
import { getSupabaseClient } from '../lib/supabase';

export type EstadoDoctor = 'activo' | 'inactivo';
export type NuevaCuentaDoctor = Omit<CuentaDoctor, 'id' | 'fechaAlta'> & {
  passwordTemporal: string;
};

interface DoctorFila {
  id: string;
  nombre: string;
  email: string;
  especialidad: string | null;
  cedula: string | null;
  suscripcion_estado: string | null;
  created_at: string;
}

function desdeFila(fila: DoctorFila): CuentaDoctor {
  return {
    id: fila.id,
    nombre: fila.nombre,
    email: fila.email,
    especialidad: fila.especialidad ?? '',
    cedula: fila.cedula ?? '',
    suscripcion: fila.suscripcion_estado?.toLowerCase() === 'inactiva' ||
      fila.suscripcion_estado?.toLowerCase() === 'inactivo' ? 'inactiva' : 'activa',
    fechaAlta: fila.created_at,
  };
}

export async function listarDoctores(): Promise<CuentaDoctor[]> {
  const { data, error } = await getSupabaseClient()
    .from('perfiles')
    .select('id, nombre, email, cedula, especialidad, suscripcion_estado, created_at')
    .eq('rol', 'DOCTOR')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`No se pudieron cargar los doctores: ${error.message}`);
  return (data as unknown as DoctorFila[]).map(desdeFila);
}

export function obtenerEstadoDoctor(doctor: CuentaDoctor): EstadoDoctor {
  return doctor.suscripcion === 'inactiva' ? 'inactivo' : 'activo';
}

export async function registrarDoctor(nuevaCuenta: NuevaCuentaDoctor): Promise<CuentaDoctor> {
  const { data, error } = await getSupabaseClient().functions.invoke('admin-create-doctor', {
    body: {
      nombre: nuevaCuenta.nombre.trim(),
      especialidad: nuevaCuenta.especialidad.trim(),
      cedula: nuevaCuenta.cedula.trim(),
      email: nuevaCuenta.email.trim().toLowerCase(),
      passwordTemporal: nuevaCuenta.passwordTemporal,
      suscripcion: nuevaCuenta.suscripcion,
    },
  });
  if (error) throw new Error(`No se pudo crear la cuenta del doctor: ${error.message}`);
  return data as CuentaDoctor;
}

export async function actualizarDoctor(
  doctorId: string,
  cambios: Pick<CuentaDoctor, 'suscripcion'>,
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('perfiles')
    .update({ suscripcion_estado: cambios.suscripcion })
    .eq('id', doctorId)
    .eq('rol', 'DOCTOR');
  if (error) throw new Error(`No se pudo actualizar la suscripción del doctor: ${error.message}`);
}
