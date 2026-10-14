import type { AbonoTratamiento, TratamientoPaciente } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { obtenerDoctorIdAutenticado } from './doctorScope';

interface AbonoFila {
  id: string;
  monto: number;
  fecha: string;
  metodo_pago: AbonoTratamiento['metodoPago'];
  concepto: string;
}

interface TratamientoFila {
  id: string;
  doctor_id: string;
  paciente_id: string;
  nombre: string;
  descripcion: string;
  costo_total: number;
  estado: TratamientoPaciente['estado'];
  fecha_creacion: string;
  pagos_abonos: AbonoFila[];
}

function desdeFila(fila: TratamientoFila): TratamientoPaciente {
  return {
    id: fila.id,
    doctorId: fila.doctor_id,
    pacienteId: fila.paciente_id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    costoTotal: Number(fila.costo_total),
    estado: fila.estado,
    fechaCreacion: fila.fecha_creacion,
    abonos: (fila.pagos_abonos ?? []).map((abono) => ({
      id: abono.id,
      monto: Number(abono.monto),
      fecha: abono.fecha,
      metodoPago: abono.metodo_pago,
      concepto: abono.concepto,
    })),
  };
}

export async function listarTratamientos(pacienteId?: string): Promise<TratamientoPaciente[]> {
  const doctorId = await obtenerDoctorIdAutenticado();
  let consulta = getSupabaseClient()
    .from('tratamientos')
    .select('*, pagos_abonos(*)')
    .order('fecha_creacion', { ascending: false });
  if (pacienteId) consulta = consulta.eq('paciente_id', pacienteId);
  if (doctorId) consulta = consulta.eq('doctor_id', doctorId);
  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron consultar los tratamientos y abonos: ${error.message}`);
  return (data as unknown as TratamientoFila[]).map(desdeFila);
}

export async function crearTratamiento(
  tratamiento: Omit<TratamientoPaciente, 'id' | 'doctorId' | 'fechaCreacion' | 'abonos'>,
): Promise<TratamientoPaciente> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede crear tratamientos.');
  const { data, error } = await getSupabaseClient()
    .from('tratamientos')
    .insert({
      doctor_id: doctorId,
      paciente_id: tratamiento.pacienteId,
      nombre: tratamiento.nombre,
      descripcion: tratamiento.descripcion,
      costo_total: tratamiento.costoTotal,
      estado: tratamiento.estado,
    })
    .select('*, pagos_abonos(*)')
    .single();
  if (error) throw new Error(`No se pudo crear el tratamiento: ${error.message}`);
  return desdeFila(data as unknown as TratamientoFila);
}

export async function actualizarTratamiento(
  tratamientoId: string,
  cambios: Partial<Pick<TratamientoPaciente, 'nombre' | 'descripcion' | 'costoTotal' | 'estado'>>,
): Promise<void> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede actualizar tratamientos.');
  const { error } = await getSupabaseClient()
    .from('tratamientos')
    .update({
      ...(cambios.nombre !== undefined ? { nombre: cambios.nombre } : {}),
      ...(cambios.descripcion !== undefined ? { descripcion: cambios.descripcion } : {}),
      ...(cambios.costoTotal !== undefined ? { costo_total: cambios.costoTotal } : {}),
      ...(cambios.estado !== undefined ? { estado: cambios.estado } : {}),
    })
    .eq('id', tratamientoId)
    .eq('doctor_id', doctorId);
  if (error) throw new Error(`No se pudo actualizar el tratamiento: ${error.message}`);
}

export async function eliminarTratamiento(tratamientoId: string): Promise<void> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede eliminar tratamientos.');
  const { error } = await getSupabaseClient()
    .from('tratamientos')
    .delete()
    .eq('id', tratamientoId)
    .eq('doctor_id', doctorId);
  if (error) throw new Error(`No se pudo eliminar el tratamiento: ${error.message}`);
}

export async function registrarAbono(
  tratamientoId: string,
  abono: Omit<AbonoTratamiento, 'id'>,
): Promise<AbonoTratamiento> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede registrar pagos o abonos.');
  const { data, error } = await getSupabaseClient().rpc('registrar_abono', {
    p_tratamiento_id: tratamientoId,
    p_monto: abono.monto,
    p_fecha: abono.fecha,
    p_metodo_pago: abono.metodoPago,
    p_concepto: abono.concepto,
  });
  if (error) throw new Error(`No se pudo registrar el abono: ${error.message}`);
  return { ...abono, id: data as string };
}

export async function actualizarAbono(
  abonoId: string,
  cambios: Partial<Omit<AbonoTratamiento, 'id'>>,
): Promise<void> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede actualizar pagos o abonos.');
  const { error } = await getSupabaseClient()
    .from('pagos_abonos')
    .update({
      ...(cambios.monto !== undefined ? { monto: cambios.monto } : {}),
      ...(cambios.fecha !== undefined ? { fecha: cambios.fecha } : {}),
      ...(cambios.metodoPago !== undefined ? { metodo_pago: cambios.metodoPago } : {}),
      ...(cambios.concepto !== undefined ? { concepto: cambios.concepto } : {}),
    })
    .eq('id', abonoId)
    .eq('doctor_id', doctorId);
  if (error) throw new Error(`No se pudo actualizar el abono: ${error.message}`);
}

export async function eliminarAbono(abonoId: string): Promise<void> {
  const doctorId = await obtenerDoctorIdAutenticado();
  if (!doctorId) throw new Error('Solo un doctor puede eliminar pagos o abonos.');
  const { error } = await getSupabaseClient()
    .from('pagos_abonos')
    .delete()
    .eq('id', abonoId)
    .eq('doctor_id', doctorId);
  if (error) throw new Error(`No se pudo eliminar el abono: ${error.message}`);
}
