import type { DatosConsultorio } from '../context/ConsultorioContext';
import { getSupabaseClient } from '../lib/supabase';
import { obtenerDoctorIdAutenticado } from './doctorScope';

export async function obtenerDatosConsultorio(): Promise<DatosConsultorio | null> {
  const doctorId = await obtenerDoctorIdAutenticado();
  let consulta = getSupabaseClient()
    .from('consultorios')
    .select('nombre_doctor, cedula, direccion, telefono, nombre_clinica');
  if (doctorId) consulta = consulta.eq('doctor_id', doctorId);
  const { data, error } = await consulta.maybeSingle();
  if (error) throw new Error(`No se pudieron consultar los datos del consultorio: ${error.message}`);
  return data
    ? {
        nombreDoctor: data.nombre_doctor,
        cedula: data.cedula,
        direccion: data.direccion,
        telefono: data.telefono,
        nombreClinica: data.nombre_clinica,
      }
    : null;
}

export async function guardarDatosConsultorio(datos: DatosConsultorio): Promise<void> {
  const { data: usuario, error: authError } = await getSupabaseClient().auth.getUser();
  if (authError) throw new Error(`No se pudo validar la sesión para guardar el consultorio: ${authError.message}`);
  if (!usuario.user) throw new Error('Inicia sesión nuevamente para guardar los datos del consultorio.');
  const { error } = await getSupabaseClient()
    .from('consultorios')
    .upsert({
      doctor_id: usuario.user.id,
      nombre_doctor: datos.nombreDoctor,
      cedula: datos.cedula,
      direccion: datos.direccion,
      telefono: datos.telefono,
      nombre_clinica: datos.nombreClinica,
    }, { onConflict: 'doctor_id' });
  if (error) throw new Error(`No se pudieron guardar los datos del consultorio: ${error.message}`);
}
