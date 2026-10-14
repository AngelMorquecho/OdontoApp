import type { Odontograma } from '../components/types/odontograma';
import { crearOdontogramaVacio } from '../components/types/odontograma';
import { crearHistoriaClinicaVacia, type Paciente, type Radiografia } from '../types/paciente';
import { getSupabaseClient } from '../lib/supabase';
import { obtenerUrlRadiografia } from './storageService';
import { ejecutarSupabase } from './supabaseErrors';
import { listarHistoriasClinicas } from './clinicalHistoryService';
import { listarNotasPorPacientes } from './evolutionNotesService';
import { obtenerDoctorIdAutenticado } from './doctorScope';

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
  const doctorId = await obtenerDoctorIdAutenticado();
  let consulta = getSupabaseClient().from('pacientes').select('*').order('nombre');
  if (doctorId) consulta = consulta.eq('doctor_id', doctorId);
  const filas = await ejecutarSupabase(
    'No se pudieron consultar los pacientes',
    () => consulta,
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
    .from('perfiles')
    .select('suscripcion_estado')
    .eq('id', authData.user.id)
    .eq('rol', 'DOCTOR')
    .single();
  if (doctorError) throw new Error(`No se pudo validar la licencia: ${doctorError.message}`);
  if (doctor.suscripcion_estado?.toLowerCase() !== 'activa' &&
      doctor.suscripcion_estado?.toLowerCase() !== 'activo') {
    throw new Error('La licencia está inactiva o vencida; contacta al administrador.');
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
    .eq('id', fila.id)
    .eq('doctor_id', authData.user.id);
  if (odontogramaError) {
    const { error: cleanupError } = await cliente
      .from('pacientes')
      .delete()
      .eq('id', fila.id)
      .eq('doctor_id', authData.user.id);
    throw new Error(
      `No se pudo inicializar el odontograma: ${odontogramaError.message}` +
        (cleanupError ? ` Tampoco se pudo revertir el alta del paciente: ${cleanupError.message}` : ''),
    );
  }
  const { error: historyError } = await cliente
    .from('historias_clinicas')
    .insert({
      doctor_id: authData.user.id,
      paciente_id: paciente.id,
      datos: paciente.historiaClinica,
    });
  if (historyError) {
    const { error: cleanupError } = await cliente
      .from('pacientes')
      .delete()
      .eq('id', paciente.id)
      .eq('doctor_id', authData.user.id);
    throw new Error(
      `No se pudo inicializar la historia clínica: ${historyError.message}` +
        (cleanupError ? ` Tampoco se pudo revertir el alta del paciente: ${cleanupError.message}` : ''),
    );
  }
  return paciente;
}

export async function actualizarPaciente(paciente: Paciente): Promise<void> {
  const cliente = getSupabaseClient();
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede actualizar expedientes de pacientes.');
  const radiografias = paciente.radiografias.map((imagen) => ({
    ...imagen,
    uri: imagen.storagePath ?? imagen.uri,
  }));
  let consulta = cliente
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
  consulta = consulta.eq('doctor_id', doctorId);
  const { error } = await consulta;
  if (error) throw new Error(`No se pudieron guardar los cambios del paciente: ${error.message}`);
}

export async function eliminarPaciente(pacienteId: string): Promise<void> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede eliminar expedientes de pacientes.');
  let consulta = getSupabaseClient()
    .from('pacientes')
    .delete()
    .eq('id', pacienteId);
  consulta = consulta.eq('doctor_id', doctorId);
  const { error } = await consulta;
  if (error) throw new Error(`No se pudo eliminar el paciente: ${error.message}`);
}
