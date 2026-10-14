import { getSupabaseClient } from '../lib/supabase';
import type { Radiografia, TipoRadiografia } from '../types/paciente';

const BUCKET_EXPEDIENTES = 'expedientes';
export const TAMANO_MAXIMO_IMAGEN = 10 * 1024 * 1024;

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

export async function obtenerUrlRadiografia(storagePath: string): Promise<string> {
  if (/^https?:\/\//i.test(storagePath)) return storagePath;
  const { data, error } = await getSupabaseClient()
    .storage
    .from(BUCKET_EXPEDIENTES)
    .createSignedUrl(storagePath, 60 * 60);
  if (error) throw new Error(`No se pudo abrir la imagen del expediente: ${error.message}`);
  return data.signedUrl;
}

export async function eliminarRadiografia(imagen: Radiografia): Promise<void> {
  const path = imagen.storagePath ?? imagen.uri;
  if (/^https?:\/\//i.test(path)) return;
  const { error } = await getSupabaseClient()
    .storage
    .from(BUCKET_EXPEDIENTES)
    .remove([path]);
  if (error) throw new Error(`No se pudo eliminar la imagen del expediente: ${error.message}`);
}

export type TipoArchivoClinico = TipoRadiografia;
