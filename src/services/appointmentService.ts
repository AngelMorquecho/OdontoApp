import type { Cita } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { obtenerDoctorIdAutenticado } from './doctorScope';

interface CitaFila {
  id: string;
  paciente_id: string;
  nombre_paciente?: string;
  fecha: string;
  hora: string;
  motivo_consulta: string;
  tratamiento_previsto: string;
  estatus: Cita['estatus'];
  notas_agenda: string | null;
  doctor_id: string;
}

function desdeFila(fila: CitaFila): Cita {
  return {
    id: fila.id,
    doctorId: fila.doctor_id,
    pacienteId: fila.paciente_id,
    nombrePaciente: fila.nombre_paciente ?? '',
    fecha: fila.fecha,
    hora: fila.hora.slice(0, 5),
    motivoConsulta: fila.motivo_consulta,
    tratamientoPrevisto: fila.tratamiento_previsto,
    estatus: fila.estatus,
    ...(fila.notas_agenda ? { notasAgenda: fila.notas_agenda } : {}),
  };
}

export async function listarCitas(): Promise<Cita[]> {
  const doctorId = await obtenerDoctorIdAutenticado();
  let consulta = getSupabaseClient()
    .from('citas')
    .select('*, paciente:pacientes(nombre)')
    .order('fecha')
    .order('hora');
  if (doctorId) consulta = consulta.eq('doctor_id', doctorId);
  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron consultar las citas: ${error.message}`);
  return (data as unknown as (CitaFila & { paciente: { nombre: string } })[]).map((fila) =>
    desdeFila({ ...fila, nombre_paciente: fila.paciente.nombre }),
  );
}

export async function crearCita(cita: Cita): Promise<Cita> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede crear citas.');
  const { data, error } = await getSupabaseClient()
    .from('citas')
    .insert({
      doctor_id: doctorId,
      paciente_id: cita.pacienteId,
      fecha: cita.fecha,
      hora: cita.hora,
      motivo_consulta: cita.motivoConsulta,
      tratamiento_previsto: cita.tratamientoPrevisto,
      estatus: cita.estatus,
      notas_agenda: cita.notasAgenda ?? null,
    })
    .select('*, paciente:pacientes(nombre)')
    .single();
  if (error) throw new Error(`No se pudo crear la cita: ${error.message}`);
  const fila = data as unknown as CitaFila & { paciente: { nombre: string } };
  return desdeFila({ ...fila, nombre_paciente: fila.paciente.nombre });
}

export async function actualizarEstatusCita(
  citaId: string,
  estatus: Cita['estatus'],
): Promise<void> {
  const doctorId = await obtenerDoctorIdAutenticado();
  let consulta = getSupabaseClient()
    .from('citas')
    .update({ estatus })
    .eq('id', citaId);
  if (doctorId) consulta = consulta.eq('doctor_id', doctorId);
  const { error } = await consulta;
  if (error) throw new Error(`No se pudo actualizar el estado de la cita: ${error.message}`);
}

export async function eliminarCita(citaId: string): Promise<void> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede eliminar citas.');
  const { error } = await getSupabaseClient()
    .from('citas')
    .delete()
    .eq('id', citaId)
    .eq('doctor_id', doctorId);
  if (error) throw new Error(`No se pudo eliminar la cita: ${error.message}`);
}
