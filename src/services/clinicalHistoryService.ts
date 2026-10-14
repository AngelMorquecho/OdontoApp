import type { HistoriaClinica } from '../types/paciente';
import { crearHistoriaClinicaVacia } from '../types/paciente';
import { getSupabaseClient } from '../lib/supabase';

export async function obtenerHistoriaClinica(pacienteId: string): Promise<HistoriaClinica> {
  const { data, error } = await getSupabaseClient()
    .from('historias_clinicas')
    .select('datos')
    .eq('paciente_id', pacienteId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo consultar la historia clínica: ${error.message}`);
  return data?.datos
    ? { ...crearHistoriaClinicaVacia(), ...(data.datos as HistoriaClinica) }
    : crearHistoriaClinicaVacia();
}

export async function listarHistoriasClinicas(
  pacientesIds: string[],
): Promise<Map<string, HistoriaClinica>> {
  if (pacientesIds.length === 0) return new Map();
  const { data, error } = await getSupabaseClient()
    .from('historias_clinicas')
    .select('paciente_id, datos')
    .in('paciente_id', pacientesIds);
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
  const { error } = await getSupabaseClient()
    .from('historias_clinicas')
    .upsert({ paciente_id: pacienteId, datos: historiaClinica }, { onConflict: 'paciente_id' });
  if (error) throw new Error(`No se pudo guardar la historia clínica: ${error.message}`);
}

export async function eliminarHistoriaClinica(pacienteId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('historias_clinicas')
    .delete()
    .eq('paciente_id', pacienteId);
  if (error) throw new Error(`No se pudo eliminar la historia clínica: ${error.message}`);
}
