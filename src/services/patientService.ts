import type { Odontograma } from '../components/types/odontograma';
import { crearOdontogramaVacio } from '../components/types/odontograma';
import { crearHistoriaClinicaVacia, type Paciente, type Radiografia } from '../types/paciente';
import { getSupabaseClient } from '../lib/supabase';
import { obtenerUrlRadiografia } from './storageService';
import { ejecutarSupabase } from './supabaseErrors';
import { listarHistoriasClinicas } from './clinicalHistoryService';
import { listarNotasPorPacientes } from './evolutionNotesService';

interface PacienteFila {
  id: string;
  doctor_id: string;
  nombre: string;
  edad: number;
  telefono: string;
  fecha_nacimiento: string | null;
  correo: string | null;
  odontograma: Odontograma;
  radiografias: Radiografia[];
}

export async function listarPacientes(): Promise<Paciente[]> {
  const filas = await ejecutarSupabase(
    'No se pudieron consultar los pacientes',
    () => getSupabaseClient().from('pacientes').select('*').order('nombre'),
  ) as PacienteFila[];
  const ids = filas.map((fila) => fila.id);
  const [historias, notas] = await Promise.all([
    listarHistoriasClinicas(ids),
    listarNotasPorPacientes(ids),
  ]);
  return Promise.all(filas.map(async (fila) => {
    const radiografias = await Promise.all((fila.radiografias ?? []).map(async (imagen) => ({
      ...imagen,
      storagePath: imagen.storagePath ?? imagen.uri,
      uri: await obtenerUrlRadiografia(imagen.storagePath ?? imagen.uri),
    })));
    const historiaClinica = historias.get(fila.id) ?? crearHistoriaClinicaVacia();
    return {
      id: fila.id,
      doctorId: fila.doctor_id,
      nombre: fila.nombre,
      edad: fila.edad,
      telefono: fila.telefono,
      ...(fila.fecha_nacimiento ? { fechaNacimiento: fila.fecha_nacimiento } : {}),
      ...(fila.correo ? { correo: fila.correo } : {}),
      odontograma: fila.odontograma?.dientes
        ? fila.odontograma
        : crearOdontogramaVacio(fila.id),
      historiaClinica: { ...historiaClinica, notasEvolucion: notas.get(fila.id) ?? [] },
      radiografias,
    };
  }));
}

export async function crearPaciente(
  datos: Pick<Paciente, 'nombre' | 'edad' | 'telefono'> &
    Partial<Pick<Paciente, 'fechaNacimiento' | 'correo'>>,
): Promise<Paciente> {
  const cliente = getSupabaseClient();
  const { data: authData, error: authError } = await cliente.auth.getUser();
  if (authError) throw new Error(`No se pudo validar la sesión del doctor: ${authError.message}`);
  if (!authData.user) throw new Error('Inicia sesión nuevamente para crear un paciente.');
  const { data: doctor, error: doctorError } = await cliente
    .from('doctores')
    .select('limite_pacientes, suscripcion, fecha_vencimiento')
    .eq('id', authData.user.id)
    .single();
  if (doctorError) throw new Error(`No se pudo validar la licencia: ${doctorError.message}`);
  if (doctor.suscripcion !== 'activa' || doctor.fecha_vencimiento < new Date().toISOString().slice(0, 10)) {
    throw new Error('La licencia está inactiva o vencida; contacta al administrador.');
  }
  const { count, error: countError } = await cliente
    .from('pacientes')
    .select('id', { count: 'exact', head: true });
  if (countError) throw new Error(`No se pudo comprobar el límite de pacientes: ${countError.message}`);
  if (doctor.limite_pacientes !== null && count !== null && count >= doctor.limite_pacientes) {
    throw new Error('Se alcanzó el límite de pacientes permitido para esta cuenta.');
  }
  const { data, error } = await cliente
    .from('pacientes')
    .insert({
      doctor_id: authData.user.id,
      nombre: datos.nombre,
      edad: datos.edad,
      telefono: datos.telefono,
      fecha_nacimiento: datos.fechaNacimiento || null,
      correo: datos.correo || null,
      odontograma: {},
    })
    .select('*')
    .single();
  if (error) throw new Error(`No se pudo crear el paciente: ${error.message}`);
  const fila = data as unknown as PacienteFila;
  const odontograma = crearOdontogramaVacio(fila.id);
  const paciente: Paciente = {
    id: fila.id,
    doctorId: fila.doctor_id,
    nombre: fila.nombre,
    edad: fila.edad,
    telefono: fila.telefono,
    ...(fila.fecha_nacimiento ? { fechaNacimiento: fila.fecha_nacimiento } : {}),
    ...(fila.correo ? { correo: fila.correo } : {}),
    odontograma,
    historiaClinica: crearHistoriaClinicaVacia(),
    radiografias: [],
  };
  const { error: odontogramaError } = await cliente
    .from('pacientes')
    .update({ odontograma })
    .eq('id', fila.id);
  if (odontogramaError) {
    const { error: cleanupError } = await cliente.from('pacientes').delete().eq('id', fila.id);
    throw new Error(
      `No se pudo inicializar el odontograma: ${odontogramaError.message}` +
        (cleanupError ? ` Tampoco se pudo revertir el alta del paciente: ${cleanupError.message}` : ''),
    );
  }
  const { error: historyError } = await cliente
    .from('historias_clinicas')
    .insert({ paciente_id: paciente.id, datos: paciente.historiaClinica });
  if (historyError) {
    const { error: cleanupError } = await cliente.from('pacientes').delete().eq('id', paciente.id);
    throw new Error(
      `No se pudo inicializar la historia clínica: ${historyError.message}` +
        (cleanupError ? ` Tampoco se pudo revertir el alta del paciente: ${cleanupError.message}` : ''),
    );
  }
  return paciente;
}

export async function actualizarPaciente(paciente: Paciente): Promise<void> {
  const cliente = getSupabaseClient();
  const radiografias = paciente.radiografias.map((imagen) => ({
    ...imagen,
    uri: imagen.storagePath ?? imagen.uri,
  }));
  const { error } = await cliente
    .from('pacientes')
    .update({
      nombre: paciente.nombre,
      edad: paciente.edad,
      telefono: paciente.telefono,
      fecha_nacimiento: paciente.fechaNacimiento || null,
      correo: paciente.correo || null,
      odontograma: paciente.odontograma,
      radiografias,
    })
    .eq('id', paciente.id);
  if (error) throw new Error(`No se pudieron guardar los cambios del paciente: ${error.message}`);
}

export async function eliminarPaciente(pacienteId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('pacientes')
    .delete()
    .eq('id', pacienteId);
  if (error) throw new Error(`No se pudo eliminar el paciente: ${error.message}`);
}
