import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { Usuario } from '../types';
import { getSupabaseClient } from '../lib/supabase';

interface PerfilFila {
  id: string;
  email: string;
  nombre_completo: string;
  rol: Usuario['rol'];
  doctor_id: string | null;
  paciente_id: string | null;
}

function esRol(valor: unknown): valor is Usuario['rol'] {
  return valor === 'SUPER_ADMIN' || valor === 'DOCTOR' || valor === 'PACIENTE';
}

export async function obtenerUsuarioDeSesion(authUser: SupabaseUser): Promise<Usuario> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('perfiles')
      .select('id, email, nombre_completo, rol, doctor_id, paciente_id')
      .eq('id', authUser.id)
      .single();
    if (error) throw error;
    const perfil = data as PerfilFila;
    if (!esRol(perfil.rol)) throw new Error('El perfil no tiene un rol válido.');
    if (perfil.rol === 'PACIENTE' && !perfil.paciente_id) {
      throw new Error('El perfil de paciente todavía no está vinculado a un expediente.');
    }
    if (perfil.rol === 'DOCTOR') {
      const { data: licencia, error: licenciaError } = await getSupabaseClient()
        .from('doctores')
        .select('suscripcion, fecha_vencimiento')
        .eq('id', perfil.doctor_id ?? perfil.id)
        .single();
      if (licenciaError) throw licenciaError;
      if (
        licencia.suscripcion !== 'activa' ||
        licencia.fecha_vencimiento < new Date().toISOString().slice(0, 10)
      ) {
        throw new Error('La licencia del doctor está inactiva o vencida. Contacta al administrador.');
      }
    }
    return {
      id: perfil.id,
      nombre: perfil.nombre_completo,
      email: perfil.email || authUser.email || '',
      rol: perfil.rol,
      ...(perfil.doctor_id ? { doctorId: perfil.doctor_id } : {}),
      ...(perfil.paciente_id ? { pacienteId: perfil.paciente_id } : {}),
    };
  } catch (error) {
    throw new Error(
      `No se pudo consultar el perfil de acceso: ${error instanceof Error ? error.message : 'error desconocido.'}`,
    );
  }
}

export async function iniciarSesionConContrasena(
  email: string,
  password: string,
): Promise<{ user: Usuario; session: Session }> {
  try {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    if (!data.user || !data.session) {
      throw new Error('El proveedor no devolvió una sesión autenticada.');
    }
    let user: Usuario;
    try {
      user = await obtenerUsuarioDeSesion(data.user);
    } catch (profileError) {
      const { error: signOutError } = await getSupabaseClient().auth.signOut();
      if (signOutError) {
        throw new Error(
          `${profileError instanceof Error ? profileError.message : 'El perfil no es válido.'} ` +
            `No se pudo limpiar la sesión: ${signOutError.message}`,
        );
      }
      throw profileError;
    }
    return {
      user,
      session: data.session,
    };
  } catch (error) {
    throw new Error(
      `No se pudo iniciar sesión: ${error instanceof Error ? error.message : 'error desconocido.'}`,
    );
  }
}

export async function cerrarSesionSupabase(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw new Error(`No se pudo cerrar sesión: ${error.message}`);
}

export function suscribirCambiosDeSesion(
  listener: (event: AuthChangeEvent, session: Session | null) => void,
) {
  return getSupabaseClient().auth.onAuthStateChange(listener).data.subscription;
}

export async function obtenerSesionActual(): Promise<Session | null> {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) throw new Error(`No se pudo recuperar la sesión: ${error.message}`);
  return data.session;
}
