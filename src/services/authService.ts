import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { Usuario } from '../types';
import type { PerfilDatabase } from '../types/database';
import { getSupabaseClient } from '../lib/supabase';
import { showAlert } from '../utils/alert';

function esRol(valor: unknown): valor is PerfilDatabase['rol'] {
  return valor === 'SUPER_ADMIN' || valor === 'DOCTOR' || valor === 'PACIENTE';
}

export async function obtenerUsuarioDeSesion(authUser: SupabaseUser): Promise<Usuario> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('perfiles')
      .select('id, email, nombre, rol, cedula, especialidad, logo_url, suscripcion_estado')
      .eq('id', authUser.id)
      .single();
    if (error) throw error;
    const perfil = data as PerfilDatabase;
    if (!esRol(perfil.rol)) throw new Error('El perfil no tiene un rol válido.');
    if (perfil.rol === 'DOCTOR' && perfil.suscripcion_estado &&
      !['activa', 'activo'].includes(perfil.suscripcion_estado.toLowerCase())) {
        throw new Error('La licencia del doctor está inactiva o vencida. Contacta al administrador.');
    }
    return {
      id: perfil.id,
      nombre: perfil.nombre,
      email: perfil.email || authUser.email || '',
      rol: perfil.rol,
      ...(perfil.rol === 'DOCTOR' ? { doctorId: perfil.id } : {}),
      ...(perfil.rol === 'PACIENTE' ? { pacienteId: perfil.id } : {}),
    };
  } catch (error) {
    const mensaje = `No se pudo consultar el perfil de acceso: ${error instanceof Error ? error.message : 'error desconocido.'}`;
    showAlert('Error', mensaje);
    throw new Error(mensaje);
  }
}

export async function iniciarSesionConContrasena(
  email: string,
  password: string,
): Promise<{ user: Usuario; session: Session }> {
  let usuarioAuth: SupabaseUser;
  let sesion: Session;
  try {
    const respuesta = await getSupabaseClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (respuesta.error) throw respuesta.error;
    if (!respuesta.data.user || !respuesta.data.session) {
      throw new Error('El proveedor no devolvió una sesión autenticada.');
    }
    usuarioAuth = respuesta.data.user;
    sesion = respuesta.data.session;
  } catch (error) {
    const mensaje = `No se pudo iniciar sesión: ${error instanceof Error ? error.message : 'error desconocido.'}`;
    showAlert('Error', mensaje);
    throw new Error(mensaje);
  }
  let user: Usuario;
  try {
    user = await obtenerUsuarioDeSesion(usuarioAuth);
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
  return { user, session: sesion };
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
  if (error) {
    showAlert('Error', `No se pudo recuperar la sesión: ${error.message}`);
    throw new Error(`No se pudo recuperar la sesión: ${error.message}`);
  }
  return data.session;
}
