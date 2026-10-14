import type { CuentaDoctor, EstadoSuscripcion } from '../types';
import { getSupabaseClient } from '../lib/supabase';

export type EstadoDoctor = 'activo' | 'inactivo' | 'vencido';
export type NuevaCuentaDoctor = Omit<CuentaDoctor, 'id' | 'fechaAlta'> & {
  passwordTemporal: string;
};

interface DoctorFila {
  id: string;
  nombre_completo: string;
  email: string;
  especialidad: string;
  cedula: string;
  suscripcion: EstadoSuscripcion;
  limite_pacientes: number | null;
  fecha_vencimiento: string;
  fecha_alta: string;
}

function desdeFila(fila: DoctorFila): CuentaDoctor {
  return {
    id: fila.id,
    nombre: fila.nombre_completo,
    email: fila.email,
    especialidad: fila.especialidad,
    cedula: fila.cedula,
    suscripcion: fila.suscripcion,
    ...(fila.limite_pacientes ? { limitePacientes: fila.limite_pacientes } : {}),
    fechaVencimiento: fila.fecha_vencimiento,
    fechaAlta: fila.fecha_alta,
  };
}

export async function listarDoctores(): Promise<CuentaDoctor[]> {
  const { data, error } = await getSupabaseClient()
    .from('doctores')
    .select('id, especialidad, cedula, suscripcion, limite_pacientes, fecha_vencimiento, fecha_alta, perfil:perfiles(nombre_completo, email)')
    .order('fecha_alta', { ascending: false });
  if (error) throw new Error(`No se pudieron cargar los doctores: ${error.message}`);
  return (data as unknown as (Omit<DoctorFila, 'nombre_completo' | 'email'> & {
    perfil: { nombre_completo: string; email: string };
  })[]).map((fila) => desdeFila({
    ...fila,
    nombre_completo: fila.perfil.nombre_completo,
    email: fila.perfil.email,
  }));
}

export function obtenerEstadoDoctor(doctor: CuentaDoctor, hoy = new Date()): EstadoDoctor {
  if (doctor.suscripcion === 'inactiva') return 'inactivo';
  const fechaVencimiento = new Date(`${doctor.fechaVencimiento}T23:59:59`);
  return Number.isNaN(fechaVencimiento.getTime()) || fechaVencimiento < hoy
    ? 'vencido'
    : 'activo';
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
      limitePacientes: nuevaCuenta.limitePacientes ?? null,
      fechaVencimiento: nuevaCuenta.fechaVencimiento,
    },
  });
  if (error) throw new Error(`No se pudo crear la cuenta del doctor: ${error.message}`);
  return data as CuentaDoctor;
}

export async function actualizarDoctor(
  doctorId: string,
  cambios: Partial<Pick<CuentaDoctor, 'suscripcion' | 'fechaVencimiento'>>,
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('doctores')
    .update({
      ...(cambios.suscripcion ? { suscripcion: cambios.suscripcion } : {}),
      ...(cambios.fechaVencimiento ? { fecha_vencimiento: cambios.fechaVencimiento } : {}),
    })
    .eq('id', doctorId);
  if (error) throw new Error(`No se pudo actualizar la licencia del doctor: ${error.message}`);
}
