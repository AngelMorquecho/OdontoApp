import type { NotaEvolucion } from '../types/paciente';
import { getSupabaseClient } from '../lib/supabase';
import { obtenerDoctorIdAutenticado } from './doctorScope';

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
  doctor_id: string;
  creado_por?: string;
}

function desdeFila(fila: NotaFila): NotaEvolucion {
  return {
    id: fila.id,
    fecha: fila.fecha ? fila.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10),
    hora: fila.hora ? fila.hora.slice(0, 5) : '00:00',
    regionOD: fila.region_od ?? '',
    evolucionProcedimiento: fila.evolucion_procedimiento ?? '',
    dx: fila.diagnostico ?? '',
    pronostico: fila.pronostico,
    plan: fila.plan ?? '',
    anestesia: fila.anestesia,
    estudios: fila.estudios,
    receta: fila.receta ?? '',
    indicaciones: fila.indicaciones ?? '',
    proximaCita: fila.proxima_cita ?? '',
    tratante: fila.tratante ?? '',
  };
}

function aFila(
  pacienteId: string,
  nota: NotaEvolucion,
  doctorId: string,
  usuarioId: string,
  id = nota.id,
  incluirDoctorId = true,
) {
  return {
    ...(incluirDoctorId ? { doctor_id: doctorId } : {}),
    ...(id ? { id } : {}),
    creado_por: usuarioId, // 👈 Se guarda quién creó la nota (Doctor o Asistente)
    paciente_id: pacienteId,
    fecha: nota.fecha || new Date().toISOString().slice(0, 10),
    hora: nota.hora || '00:00',
    region_od: nota.regionOD ?? '',
    evolucion_procedimiento: nota.evolucionProcedimiento ?? '',
    diagnostico: nota.dx ?? '',
    pronostico: nota.pronostico,
    plan: nota.plan ?? '',
    anestesia: nota.anestesia,
    estudios: nota.estudios,
    receta: nota.receta ?? '',
    indicaciones: nota.indicaciones ?? '',
    proxima_cita: nota.proximaCita || null,
    tratante: nota.tratante ?? '',
  };
}

export async function listarNotasEvolucion(pacienteId: string): Promise<NotaEvolucion[]> {
  const doctorId = await obtenerDoctorIdAutenticado();
  const cliente = getSupabaseClient();

  let consulta = cliente
    .from('notas_evolucion')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('fecha', { ascending: false });

  if (doctorId) {
    consulta = consulta.eq('doctor_id', doctorId);
  }

  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron consultar las notas de evolución: ${error.message}`);
  return (data as unknown as NotaFila[]).map(desdeFila);
}

export async function listarNotasPorPacientes(
  pacientesIds: string[],
): Promise<Map<string, NotaEvolucion[]>> {
  if (pacientesIds.length === 0) return new Map();
  const doctorId = await obtenerDoctorIdAutenticado();
  const cliente = getSupabaseClient();

  let consulta = cliente
    .from('notas_evolucion')
    .select('*')
    .in('paciente_id', pacientesIds)
    .order('fecha', { ascending: false });

  if (doctorId) {
    consulta = consulta.eq('doctor_id', doctorId);
  }

  const { data, error } = await consulta;
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
  const cliente = getSupabaseClient();
  const { data: authData } = await cliente.auth.getUser();
  const doctorId = await obtenerDoctorIdAutenticado();

  if (!authData?.user) throw new Error('Inicia sesión nuevamente para guardar la nota.');
  if (!doctorId) throw new Error('No se pudo identificar el consultorio/doctor asociado.');

  const fila = aFila(pacienteId, nota, doctorId, authData.user.id, '');

  const { data, error } = await cliente
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
  const cliente = getSupabaseClient();
  const { data: authData } = await cliente.auth.getUser();
  const doctorId = await obtenerDoctorIdAutenticado();

  if (!authData?.user) throw new Error('Inicia sesión nuevamente para actualizar la nota.');
  if (!doctorId) throw new Error('No se pudo identificar el consultorio/doctor asociado.');

  const fila = aFila(pacienteId, nota, doctorId, authData.user.id, nota.id, false);
  delete (fila as { id?: string }).id;

  const { error } = await cliente
    .from('notas_evolucion')
    .update(fila)
    .eq('id', nota.id)
    .eq('paciente_id', pacienteId)
    .eq('doctor_id', doctorId);

  if (error) throw new Error(`No se pudo actualizar la nota de evolución: ${error.message}`);
}

export async function eliminarNotaEvolucion(notaId: string): Promise<void> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('No se pudo validar el consultorio para eliminar la nota.');

  const { error } = await getSupabaseClient()
    .from('notas_evolucion')
    .delete()
    .eq('id', notaId)
    .eq('doctor_id', doctorId);

  if (error) throw new Error(`No se pudo eliminar la nota de evolución: ${error.message}`);
}

export async function eliminarNotasEvolucionPaciente(pacienteId: string): Promise<void> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('No se pudo validar el consultorio para eliminar las notas.');

  const { error } = await getSupabaseClient()
    .from('notas_evolucion')
    .delete()
    .eq('paciente_id', pacienteId)
    .eq('doctor_id', doctorId);

  if (error) throw new Error(`No se pudieron eliminar las notas de evolución: ${error.message}`);
}