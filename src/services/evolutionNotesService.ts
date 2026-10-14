import type { NotaEvolucion } from '../types/paciente';
import { getSupabaseClient } from '../lib/supabase';

interface NotaFila {
  id: string;
  fecha: string;
  hora: string;
  region_od: string;
  evolucion_procedimiento: string;
  diagnostico: string;
  pronostico: NotaEvolucion['pronostico'];
  plan: string;
  anestesia: NotaEvolucion['anestesia'];
  estudios: NotaEvolucion['estudios'];
  receta: string;
  indicaciones: string;
  proxima_cita: string | null;
  tratante: string;
}

function desdeFila(fila: NotaFila): NotaEvolucion {
  return {
    id: fila.id,
    fecha: fila.fecha,
    hora: fila.hora.slice(0, 5),
    regionOD: fila.region_od,
    evolucionProcedimiento: fila.evolucion_procedimiento,
    dx: fila.diagnostico,
    pronostico: fila.pronostico,
    plan: fila.plan,
    anestesia: fila.anestesia,
    estudios: fila.estudios,
    receta: fila.receta,
    indicaciones: fila.indicaciones,
    proximaCita: fila.proxima_cita ?? '',
    tratante: fila.tratante,
  };
}

function aFila(pacienteId: string, nota: NotaEvolucion, id = nota.id) {
  return {
    ...(id ? { id } : {}),
    paciente_id: pacienteId,
    fecha: nota.fecha,
    hora: nota.hora,
    region_od: nota.regionOD,
    evolucion_procedimiento: nota.evolucionProcedimiento,
    diagnostico: nota.dx,
    pronostico: nota.pronostico,
    plan: nota.plan,
    anestesia: nota.anestesia,
    estudios: nota.estudios,
    receta: nota.receta,
    indicaciones: nota.indicaciones,
    proxima_cita: nota.proximaCita || null,
    tratante: nota.tratante,
  };
}

export async function listarNotasEvolucion(pacienteId: string): Promise<NotaEvolucion[]> {
  const { data, error } = await getSupabaseClient()
    .from('notas_evolucion')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('fecha', { ascending: false });
  if (error) throw new Error(`No se pudieron consultar las notas de evolución: ${error.message}`);
  return (data as unknown as NotaFila[]).map(desdeFila);
}

export async function listarNotasPorPacientes(
  pacientesIds: string[],
): Promise<Map<string, NotaEvolucion[]>> {
  if (pacientesIds.length === 0) return new Map();
  const { data, error } = await getSupabaseClient()
    .from('notas_evolucion')
    .select('*')
    .in('paciente_id', pacientesIds)
    .order('fecha', { ascending: false });
  if (error) throw new Error(`No se pudieron consultar las notas de evolución: ${error.message}`);
  const resultado = new Map<string, NotaEvolucion[]>();
  for (const fila of data as unknown as (NotaFila & { paciente_id: string })[]) {
    const lista = resultado.get(fila.paciente_id) ?? [];
    lista.push(desdeFila(fila));
    resultado.set(fila.paciente_id, lista);
  }
  return resultado;
}

export async function crearNotaEvolucion(
  pacienteId: string,
  nota: NotaEvolucion,
): Promise<NotaEvolucion> {
  const fila = aFila(pacienteId, nota, '');
  const { data, error } = await getSupabaseClient()
    .from('notas_evolucion')
    .insert(fila)
    .select('*')
    .single();
  if (error) throw new Error(`No se pudo guardar la nota de evolución: ${error.message}`);
  return desdeFila(data as unknown as NotaFila);
}

export async function actualizarNotaEvolucion(
  pacienteId: string,
  nota: NotaEvolucion,
): Promise<void> {
  const fila = aFila(pacienteId, nota);
  delete fila.id;
  const { error } = await getSupabaseClient()
    .from('notas_evolucion')
    .update(fila)
    .eq('id', nota.id)
    .eq('paciente_id', pacienteId);
  if (error) throw new Error(`No se pudo actualizar la nota de evolución: ${error.message}`);
}

export async function eliminarNotaEvolucion(notaId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('notas_evolucion')
    .delete()
    .eq('id', notaId);
  if (error) throw new Error(`No se pudo eliminar la nota de evolución: ${error.message}`);
}

export async function eliminarNotasEvolucionPaciente(pacienteId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('notas_evolucion')
    .delete()
    .eq('paciente_id', pacienteId);
  if (error) throw new Error(`No se pudieron eliminar las notas de evolución: ${error.message}`);
}
