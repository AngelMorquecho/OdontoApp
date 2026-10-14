import type { HistoriaClinica } from '../types/paciente';
import { crearHistoriaClinicaVacia } from '../types/paciente';
import { getSupabaseClient } from '../lib/supabase';
import { obtenerDoctorIdAutenticado } from './doctorScope';

export async function obtenerHistoriaClinica(pacienteId: string): Promise<HistoriaClinica> {
  const doctorId = await obtenerDoctorIdAutenticado();
  let consulta = getSupabaseClient()
    .from('historias_clinicas')
    .select('datos')
    .eq('paciente_id', pacienteId);
  if (doctorId) consulta = consulta.eq('doctor_id', doctorId);
  const { data, error } = await consulta.maybeSingle();
  if (error) throw new Error(`No se pudo consultar la historia clínica: ${error.message}`);
  return data?.datos
    ? { ...crearHistoriaClinicaVacia(), ...(data.datos as HistoriaClinica) }
    : crearHistoriaClinicaVacia();
}

export async function listarHistoriasClinicas(
  pacientesIds: string[],
): Promise<Map<string, HistoriaClinica>> {
  if (pacientesIds.length === 0) return new Map();
  const doctorId = await obtenerDoctorIdAutenticado();
  let consulta = getSupabaseClient()
    .from('historias_clinicas')
    .select('paciente_id, datos')
    .in('paciente_id', pacientesIds);
  if (doctorId) consulta = consulta.eq('doctor_id', doctorId);
  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron consultar las historias clínicas: ${error.message}`);
  return new Map(data.map((item) => [
    item.paciente_id as string,
    { ...crearHistoriaClinicaVacia(), ...(item.datos as HistoriaClinica) },
  ]));
}

export async function guardarHistoriaClinica(
  pacienteId: string,
  historiaClinica: HistoriaClinica,
): Promise<void> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede actualizar la historia clínica.');
  const { error } = await getSupabaseClient()
    .from('historias_clinicas')
    .upsert({
      doctor_id: doctorId,
      paciente_id: pacienteId,
      datos: historiaClinica,
    }, { onConflict: 'paciente_id' });
  if (error) throw new Error(`No se pudo guardar la historia clínica: ${error.message}`);
}

export async function eliminarHistoriaClinica(pacienteId: string): Promise<void> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede eliminar historias clínicas.');
  let consulta = getSupabaseClient()
    .from('historias_clinicas')
    .delete()
    .eq('paciente_id', pacienteId);
  consulta = consulta.eq('doctor_id', doctorId);
  const { error } = await consulta;
  if (error) throw new Error(`No se pudo eliminar la historia clínica: ${error.message}`);
}
