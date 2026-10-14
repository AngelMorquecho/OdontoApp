import type { Receta } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { obtenerDoctorIdAutenticado } from './doctorScope';

interface RecetaFila {
  id: string;
  doctor_id: string;
  paciente_id: string;
  fecha_emision: string;
  diagnostico: string;
  medicamentos: Receta['medicamentos'];
  indicaciones_generales: string;
  estado_tratamiento: Receta['estadoTratamiento'];
}

function desdeFila(fila: RecetaFila): Receta {
  return {
    id: fila.id,
    doctorId: fila.doctor_id,
    pacienteId: fila.paciente_id,
    fechaEmision: fila.fecha_emision,
    diagnostico: fila.diagnostico,
    medicamentos: fila.medicamentos,
    indicacionesGenerales: fila.indicaciones_generales,
    estadoTratamiento: fila.estado_tratamiento,
  };
}

export async function listarRecetas(pacienteId?: string): Promise<Receta[]> {
  const doctorId = await obtenerDoctorIdAutenticado();
  let consulta = getSupabaseClient()
    .from('recetas')
    .select('*')
    .order('fecha_emision', { ascending: false });
  if (pacienteId) consulta = consulta.eq('paciente_id', pacienteId);
  if (doctorId) consulta = consulta.eq('doctor_id', doctorId);
  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron consultar las recetas: ${error.message}`);
  return (data as unknown as RecetaFila[]).map(desdeFila);
}

export async function crearReceta(receta: Receta): Promise<Receta> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede emitir recetas.');
  const { data, error } = await getSupabaseClient()
    .from('recetas')
    .insert({
      doctor_id: doctorId,
      paciente_id: receta.pacienteId,
      fecha_emision: receta.fechaEmision,
      diagnostico: receta.diagnostico,
      medicamentos: receta.medicamentos,
      indicaciones_generales: receta.indicacionesGenerales,
      estado_tratamiento: receta.estadoTratamiento,
    })
    .select('*')
    .single();
  if (error) throw new Error(`No se pudo guardar la receta: ${error.message}`);
  return desdeFila(data as unknown as RecetaFila);
}

export async function actualizarReceta(receta: Receta): Promise<void> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede actualizar recetas.');
  const { error } = await getSupabaseClient()
    .from('recetas')
    .update({
      diagnostico: receta.diagnostico,
      medicamentos: receta.medicamentos,
      indicaciones_generales: receta.indicacionesGenerales,
      estado_tratamiento: receta.estadoTratamiento,
    })
    .eq('id', receta.id)
    .eq('doctor_id', doctorId);
  if (error) throw new Error(`No se pudo actualizar la receta: ${error.message}`);
}

export async function eliminarReceta(recetaId: string): Promise<void> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede eliminar recetas.');
  const { error } = await getSupabaseClient()
    .from('recetas')
    .delete()
    .eq('id', recetaId)
    .eq('doctor_id', doctorId);
  if (error) throw new Error(`No se pudo eliminar la receta: ${error.message}`);
}
