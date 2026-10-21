import type { RolPerfil } from '../types/database';
import { getSupabaseClient } from '../lib/supabase';

export async function obtenerDoctorIdAutenticado(): Promise<string | null> {
  const cliente = getSupabaseClient();
  const { data: usuario, error: errorUsuario } = await cliente.auth.getUser();

  if (errorUsuario) {
    throw new Error(`No se pudo validar la sesión actual: ${errorUsuario.message}`);
  }
  if (!usuario.user) throw new Error('Inicia sesión nuevamente para consultar los expedientes.');

  // Seleccionamos también la columna doctor_id
  const { data, error } = await cliente
    .from('perfiles')
    .select('id, rol, doctor_id')
    .eq('id', usuario.user.id)
    .single();

  if (error) throw new Error(`No se pudo validar el perfil de acceso: ${error.message}`);

  const perfil = data as { id: string; rol: unknown; doctor_id: string | null };

  // Incluimos ASISTENTE dentro de los roles válidos
  if (
    perfil.id !== usuario.user.id ||
    (perfil.rol !== 'SUPER_ADMIN' &&
      perfil.rol !== 'DOCTOR' &&
      perfil.rol !== 'ASISTENTE' &&
      perfil.rol !== 'PACIENTE')
  ) {
    throw new Error('El perfil de acceso tiene datos no válidos.');
  }

  // Si es ASISTENTE, retornamos el doctor_id asignado; si es DOCTOR, retornamos su propio ID
  if (perfil.rol === 'ASISTENTE' && perfil.doctor_id) {
    return perfil.doctor_id;
  }

  return perfil.rol === 'DOCTOR' ? usuario.user.id : null;
}