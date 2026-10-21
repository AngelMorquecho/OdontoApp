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
  creado_por?: string;
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
  const cliente = getSupabaseClient();
  const { data: authData } = await cliente.auth.getUser();
  const doctorId = await obtenerDoctorIdAutenticado();

  const idBusqueda = doctorId || authData?.user?.id;

  let consulta = cliente
    .from('citas')
    .select('*, paciente:pacientes(nombre)')
    .order('fecha')
    .order('hora');

  if (authData?.user?.id && idBusqueda) {
    // Si es asistente o doctor, busca las citas del doctor asignado O las creadas por la asistente
    consulta = consulta.or(`doctor_id.eq.${idBusqueda},creado_por.eq.${authData.user.id}`);
  } else if (idBusqueda) {
    consulta = consulta.eq('doctor_id', idBusqueda);
  }

  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron consultar las citas: ${error.message}`);

  return (data as unknown as (CitaFila & { paciente?: { nombre: string } })[]).map((fila) =>
    desdeFila({ ...fila, nombre_paciente: fila.paciente?.nombre ?? '' }),
  );
}

export async function crearCita(cita: Cita): Promise<Cita> {
  const cliente = getSupabaseClient();
  const { data: authData } = await cliente.auth.getUser();
  const doctorIdAsignado = await obtenerDoctorIdAutenticado();

  if (!authData?.user) throw new Error('Inicia sesión nuevamente para agendar citas.');
  if (!doctorIdAsignado) throw new Error('No se pudo determinar el doctor asociado.');
const fechaHoraIso = `${cita.fecha}T${cita.hora}:00`;
 const { data, error } = await cliente
  .from('citas')
  .insert({
    doctor_id: doctorIdAsignado,
    creado_por: authData.user.id,
    paciente_id: cita.pacienteId,
    fecha: cita.fecha,
    hora: cita.hora,
    fecha_hora: fechaHoraIso, 
    motivo_consulta: cita.motivoConsulta,
    tratamiento_previsto: cita.tratamientoPrevisto,
    estatus: cita.estatus,
    notas_agenda: cita.notasAgenda ?? null,
  })
  .select('*, paciente:pacientes(nombre)')
  .single();

  if (error) throw new Error(`No se pudo crear la cita: ${error.message}`);

  const fila = data as unknown as CitaFila & { paciente?: { nombre: string } };
  return desdeFila({ ...fila, nombre_paciente: fila.paciente?.nombre ?? '' });
}

export async function actualizarEstatusCita(
  citaId: string,
  estatus: Cita['estatus'],
): Promise<void> {
  const cliente = getSupabaseClient();
  const doctorId = await obtenerDoctorIdAutenticado();

  if (!doctorId) {
    throw new Error('No se encontró el ID del doctor asociado para actualizar la cita.');
  }

  const { error } = await cliente
    .from('citas')
    .update({ estatus })
    .eq('id', citaId)
    .eq('doctor_id', doctorId);

  if (error) {
    throw new Error(`No se pudo actualizar el estado de la cita: ${error.message}`);
  }
}

export async function eliminarCita(citaId: string): Promise<void> {
  const cliente = getSupabaseClient();
  const doctorId = await obtenerDoctorIdAutenticado();

  if (!doctorId) throw new Error('No se pudo validar el acceso para eliminar la cita.');

  const { error } = await cliente
    .from('citas')
    .delete()
    .eq('id', citaId)
    .eq('doctor_id', doctorId);

  if (error) throw new Error(`No se pudo eliminar la cita: ${error.message}`);
}