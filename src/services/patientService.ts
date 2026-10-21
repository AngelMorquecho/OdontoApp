import type { Odontograma } from '../components/types/odontograma';
import { crearOdontogramaVacio } from '../components/types/odontograma';
import { crearHistoriaClinicaVacia, type Paciente, type Radiografia } from '../types/paciente';
import { getSupabaseClient } from '../lib/supabase';
import { listarRadiografiasPaciente } from './storageService';
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
}

export async function listarPacientes(): Promise<Paciente[]> {
  const cliente = getSupabaseClient();
  const { data: authData } = await cliente.auth.getUser();
  const doctorId = await obtenerDoctorIdAutenticado();

  const idBusqueda = doctorId || authData?.user?.id;
  if (!idBusqueda) return [];

  // 1. Consulta de pacientes del consultorio
  let consulta = cliente
    .from('pacientes')
    .select('*')
    .or(`doctor_id.eq.${idBusqueda},creado_por.eq.${authData?.user?.id}`)
    .order('nombre');

  const filas = (await ejecutarSupabase(
    'No se pudieron consultar los pacientes',
    () => consulta,
  )) as PacienteFila[];

  if (!filas || filas.length === 0) return [];

  const ids = filas.map((fila) => fila.id);

  // 2. Carga paralela defensiva de Historias, Notas y Radiografías/Fotos
  let historias = new Map();
  let notas = new Map();
  const mapaRadiografias = new Map<string, Radiografia[]>();

  try {
    const [hRes, nRes] = await Promise.all([
      listarHistoriasClinicas(ids),
      listarNotasPorPacientes(ids),
    ]);
    historias = hRes || new Map();
    notas = nRes || new Map();

    // 👈 Usamos la función centralizada de storageService para cada paciente
    await Promise.all(
      ids.map(async (pacienteId) => {
        try {
          const imgs = await listarRadiografiasPaciente(pacienteId);
          mapaRadiografias.set(pacienteId, imgs);
        } catch (e) {
          console.warn(`Aviso: No se pudieron cargar radiografías de ${pacienteId}:`, e);
          mapaRadiografias.set(pacienteId, []);
        }
      }),
    );
  } catch (err) {
    console.warn('Aviso: Detalle durante la carga masiva del expediente:', err);
  }

  // 3. Mapeo final unificado
  return filas.map((fila) => {
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
      radiografias: mapaRadiografias.get(fila.id) ?? [],
    };
  });
}

export async function crearPaciente(
  datos: Pick<Paciente, 'nombre' | 'edad' | 'telefono'> &
    Partial<Pick<Paciente, 'fechaNacimiento' | 'correo'>>,
): Promise<Paciente> {
  const cliente = getSupabaseClient();
  const { data: authData, error: authError } = await cliente.auth.getUser();

  if (authError) throw new Error(`No se pudo validar la sesión: ${authError.message}`);
  if (!authData.user) throw new Error('Inicia sesión nuevamente para crear un paciente.');

  // 1. Obtener perfil del usuario activo (Doctor o Asistente)
  const { data: perfil, error: perfilError } = await cliente
    .from('perfiles')
    .select('id, rol, doctor_id, suscripcion_estado')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (perfilError || !perfil) {
    throw new Error(`No se pudo validar el usuario: ${perfilError?.message || 'Perfil no encontrado'}`);
  }

  // 2. Determinar el doctor_id real que posee el expediente
  const doctorIdAsignado = perfil.rol === 'ASISTENTE' ? perfil.doctor_id : perfil.id;

  if (!doctorIdAsignado) {
    throw new Error('No se encontró un doctor válido asociado a esta cuenta.');
  }

  // 3. Validar la licencia del consultorio
  const { data: doctor, error: doctorError } = await cliente
    .from('perfiles')
    .select('suscripcion_estado')
    .eq('id', doctorIdAsignado)
    .single();

  if (doctorError) throw new Error(`No se pudo validar la licencia del doctor: ${doctorError.message}`);

  const estadoLicencia = doctor?.suscripcion_estado?.toLowerCase();
  if (estadoLicencia !== 'activa' && estadoLicencia !== 'activo') {
    throw new Error('La licencia del consultorio está inactiva o vencida; contacta al administrador.');
  }

  // 4. Insertar el nuevo paciente
  const { data, error } = await cliente
    .from('pacientes')
    .insert({
      doctor_id: doctorIdAsignado,
      creado_por: authData.user.id,
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

  // 5. Inicializar Odontograma
  const { error: odontogramaError } = await cliente
    .from('pacientes')
    .update({ odontograma })
    .eq('id', fila.id)
    .eq('doctor_id', doctorIdAsignado);

  if (odontogramaError) {
    const { error: cleanupError } = await cliente
      .from('pacientes')
      .delete()
      .eq('id', fila.id)
      .eq('doctor_id', doctorIdAsignado);

    throw new Error(
      `No se pudo inicializar el odontograma: ${odontogramaError.message}` +
        (cleanupError ? ` Tampoco se pudo revertir el alta del paciente: ${cleanupError.message}` : ''),
    );
  }

  // 6. Inicializar Historia Clínica
  const { error: historyError } = await cliente
    .from('historias_clinicas')
    .insert({
      doctor_id: doctorIdAsignado,
      paciente_id: paciente.id,
      datos: paciente.historiaClinica,
    });

  if (historyError) {
    const { error: cleanupError } = await cliente
      .from('pacientes')
      .delete()
      .eq('id', paciente.id)
      .eq('doctor_id', doctorIdAsignado);

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

  if (!doctorId) throw new Error('No se pudo verificar la sesión del usuario.');

  const { error } = await cliente
    .from('pacientes')
    .update({
      nombre: paciente.nombre,
      edad: paciente.edad,
      telefono: paciente.telefono,
      fecha_nacimiento: paciente.fechaNacimiento || null,
      correo: paciente.correo || null,
      odontograma: paciente.odontograma,
    })
    .eq('id', paciente.id)
    .eq('doctor_id', doctorId);

  if (error) throw new Error(`No se pudieron guardar los cambios del paciente: ${error.message}`);
}

export async function eliminarPaciente(pacienteId: string): Promise<void> {
  const doctorId = await obtenerDoctorIdAutenticado();

  if (!doctorId) throw new Error('No se pudo verificar la sesión del usuario.');

  const { error } = await getSupabaseClient()
    .from('pacientes')
    .delete()
    .eq('id', pacienteId)
    .eq('doctor_id', doctorId);

  if (error) throw new Error(`No se pudo eliminar el paciente: ${error.message}`);
}