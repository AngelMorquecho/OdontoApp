import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';

interface CrearAsistenteParams {
  nombre: string;
  email: string;
  password: string;
  doctorId: string;
}

export const crearAsistente = async ({
  nombre,
  email,
  password,
  doctorId,
}: CrearAsistenteParams) => {
  const supabaseMain = getSupabaseClient();

  // 1. Obtener el ID del consultorio desde la tabla 'consultorios' asociada al doctor
  const { data: consultorio, error: consultorioError } = await supabaseMain
    .from('consultorios')
    .select('id')
    .eq('doctor_id', doctorId)
    .maybeSingle();

  if (consultorioError) {
    console.error('Error al consultar el consultorio del doctor:', consultorioError);
  }

  console.log('🏢 [crearAsistente] Consultorio encontrado:', consultorio?.id);

  // Extraer URL y Key de la instancia principal de Supabase
  const supabaseUrl = (supabaseMain as any).supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = (supabaseMain as any).supabaseKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('No se pudieron obtener las credenciales de Supabase.');
  }

  // Cliente temporal aislado que no toca la sesión activa del Doctor
  const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  // 2. Transmitir el consultorio_id correcto extraído de la tabla 'consultorios'
  const { data: authData, error: authError } = await tempSupabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: password,
    options: {
      data: {
        nombre: nombre.trim(),
        rol: 'ASISTENTE',
        doctor_id: doctorId,
        consultorio_id: consultorio?.id ?? null, // <-- ID proveniente de la tabla consultorios
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('No se pudo crear la cuenta de usuario.');

  return authData.user;
};

export const obtenerAsistentesPorDoctor = async (doctorId: string) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('perfiles')
    .select('id, email, nombre, rol, doctor_id, consultorio_id, created_at')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error Supabase al traer asistentes:', error);
    throw error;
  }
  console.log(data);
  return data || [];
};