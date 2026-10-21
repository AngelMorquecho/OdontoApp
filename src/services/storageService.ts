import { getSupabaseClient } from '../lib/supabase';
import type { Radiografia, TipoRadiografia } from '../types/paciente';
import { obtenerDoctorIdAutenticado } from './doctorScope';

const BUCKET_EXPEDIENTES = 'expedientes';
export const TAMANO_MAXIMO_IMAGEN = 10 * 1024 * 1024;

export type TipoArchivoClinico = TipoRadiografia;

interface ArchivoFila {
  id: string;
  doctor_id: string;
  paciente_id: string;
  tipo: TipoRadiografia;
  descripcion?: string;
  url_archivo: string;
  created_at?: string;
}

/**
 * 1. LISTAR ARCHIVOS / GALERÍA
 * Consulta la tabla 'archivos_pacientes' y genera Signed URLs para cada imagen.
 */
export async function listarRadiografiasPaciente(pacienteId: string): Promise<Radiografia[]> {
  const doctorId = await obtenerDoctorIdAutenticado();
  const cliente = getSupabaseClient();

  let consulta = cliente
    .from('archivos_pacientes')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('created_at', { ascending: false });

  if (doctorId) {
    consulta = consulta.eq('doctor_id', doctorId);
  }

  const { data, error } = await consulta;

  if (error) {
    throw new Error(`No se pudieron consultar los archivos del expediente: ${error.message}`);
  }

  if (!data || data.length === 0) return [];

  const listaProcesada = await Promise.all(
    (data as ArchivoFila[]).map(async (fila) => {
      let uri = fila.url_archivo;
      try {
        uri = await obtenerUrlRadiografia(fila.url_archivo);
      } catch (e) {
        console.warn(`No se pudo generar signedUrl para ${fila.url_archivo}`);
      }

      return {
        id: fila.id,
        tipo: fila.tipo || 'Fotografía',
        uri,
        storagePath: fila.url_archivo,
        fecha: fila.created_at ? fila.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        descripcion: fila.descripcion ?? '',
        notas: fila.descripcion ?? '',
      } as unknown as Radiografia;
    }),
  );

  return listaProcesada;
}

/**
 * 2. GUARDAR METADATOS EN BASE DE DATOS
 * Registra la fila en la tabla 'archivos_pacientes' asociándola al consultorio.
 */
export async function guardarMetaArchivo(
  pacienteId: string,
  tipo: TipoRadiografia,
  descripcion: string,
  storagePath: string,
): Promise<Radiografia> {
  const cliente = getSupabaseClient();
  const { data: authData } = await cliente.auth.getUser();
  const doctorId = await obtenerDoctorIdAutenticado();

  if (!authData?.user) throw new Error('Inicia sesión nuevamente.');
  if (!doctorId) throw new Error('No se pudo identificar el consultorio/doctor asociado.');

  const { data, error } = await cliente
    .from('archivos_pacientes')
    .insert({
      doctor_id: doctorId,
      paciente_id: pacienteId,
      tipo,
      descripcion,
      url_archivo: storagePath,
      creado_por: authData.user.id,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Error guardando registro del archivo: ${error.message}`);
  }

  const uri = await obtenerUrlRadiografia(storagePath);

  return {
    id: data.id,
    tipo: data.tipo,
    uri,
    storagePath: data.url_archivo,
    fecha: new Date().toISOString().slice(0, 10),
    descripcion: data.descripcion ?? '',
    notas: data.descripcion ?? '',
  } as unknown as Radiografia;
}

/**
 * 3. SUBIR ARCHIVO A SUPABASE STORAGE
 */
export async function subirRadiografia(
  doctorId: string,
  pacienteId: string,
  uri: string,
): Promise<{ storagePath: string; uri: string }> {
  let blob: Blob;
  try {
    const response = await fetch(uri);
    if (!response.ok) throw new Error(`No se pudo leer el archivo seleccionado (${response.status}).`);
    blob = await response.blob();
  } catch (error) {
    throw new Error(
      `No se pudo preparar la imagen para subirla: ${error instanceof Error ? error.message : 'error de lectura.'}`,
    );
  }

  if (!blob.size) throw new Error('El archivo seleccionado está vacío o no se puede leer.');
  if (blob.size > TAMANO_MAXIMO_IMAGEN) {
    throw new Error('La imagen supera el límite permitido de 10 MB.');
  }

  const mimeType = blob.type.toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new Error('Formato de imagen no permitido. Usa JPEG, PNG o WebP.');
  }

  const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.slice('image/'.length);
  const nombre = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const storagePath = `${doctorId}/${pacienteId}/${nombre}`;
  const bytes = new Uint8Array(await blob.arrayBuffer());

  const { error } = await getSupabaseClient()
    .storage
    .from(BUCKET_EXPEDIENTES)
    .upload(storagePath, bytes, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`No se pudo subir la imagen al expediente: ${error.message}`);

  try {
    return { storagePath, uri: await obtenerUrlRadiografia(storagePath) };
  } catch (error) {
    const { error: cleanupError } = await getSupabaseClient()
      .storage
      .from(BUCKET_EXPEDIENTES)
      .remove([storagePath]);

    if (cleanupError) {
      throw new Error(
        `No se pudo obtener el acceso seguro a la imagen y tampoco limpiar el archivo: ${cleanupError.message}`,
      );
    }
    throw error;
  }
}

/**
 * OBTENER URL DE VISUALIZACIÓN FIRMADA
 */
export async function obtenerUrlRadiografia(storagePath: string): Promise<string> {
  if (!storagePath) return '';
  if (/^https?:\/\//i.test(storagePath)) return storagePath;

  // 1. Limpiar el nombre del bucket si viene incluido
  const pathLimpio = storagePath.replace(/^\/?expedientes\//i, '');

  const cliente = getSupabaseClient();

  // 2. Intentar firmar la URL
  const { data, error } = await cliente
    .storage
    .from(BUCKET_EXPEDIENTES)
    .createSignedUrl(pathLimpio, 60 * 60);

  if (error || !data?.signedUrl) {
    // Retorna la URL pública si la firma no está disponible
    return cliente.storage.from(BUCKET_EXPEDIENTES).getPublicUrl(pathLimpio).data.publicUrl;
  }

  // 3. Convertir ruta relativa de Supabase en URL absoluta válida para React Native
  if (data.signedUrl.startsWith('/')) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const baseUrl = supabaseUrl.replace(/\/$/, '');
    return `${baseUrl}/storage/v1${data.signedUrl}`;
  }

  return data.signedUrl;
}
/**
 * 5. ELIMINAR ARCHIVO (STORAGE Y TABLA)
 */
export async function eliminarRadiografia(imagen: Radiografia): Promise<void> {
  const cliente = getSupabaseClient();
  const path = imagen.storagePath ?? imagen.uri;

  // 1. Eliminar fila en la tabla 'archivos_pacientes'
  if (imagen.id) {
    const { error: dbErr } = await cliente
      .from('archivos_pacientes')
      .delete()
      .eq('id', imagen.id);

    if (dbErr) console.warn(`Error eliminando registro en BD: ${dbErr.message}`);
  }

  // 2. Eliminar objeto del Bucket
  if (!/^https?:\/\//i.test(path)) {
    const { error } = await cliente
      .storage
      .from(BUCKET_EXPEDIENTES)
      .remove([path]);

    if (error) throw new Error(`No se pudo eliminar la imagen del expediente: ${error.message}`);
  }
}