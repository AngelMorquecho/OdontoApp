import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AltaDoctor {
  nombre: string;
  especialidad: string;
  cedula: string;
  email: string;
  passwordTemporal: string;
  suscripcion: 'activa' | 'inactiva';
}

async function manejarSolicitud(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return Response.json({ error: 'Método no permitido.' }, { status: 405, headers: corsHeaders });
  }
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return Response.json({ error: 'Se requiere una sesión autenticada.' }, { status: 401, headers: corsHeaders });
  }

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceRoleKey) {
    return Response.json({ error: 'La función no tiene configuradas sus credenciales de Supabase.' }, { status: 500, headers: corsHeaders });
  }

  const callerClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: caller, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !caller.user) {
    return Response.json({ error: 'La sesión del administrador no es válida.' }, { status: 401, headers: corsHeaders });
  }
  const { data: profile, error: profileError } = await adminClient
    .from('perfiles')
    .select('rol')
    .eq('id', caller.user.id)
    .single();
  if (profileError || !profile || profile.rol !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Acceso exclusivo para SuperAdmin.' }, { status: 403, headers: corsHeaders });
  }

  let input: AltaDoctor;
  try {
    const body: unknown = await request.json();
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return Response.json({ error: 'Los datos del doctor no son válidos.' }, { status: 400, headers: corsHeaders });
    }
    input = body as AltaDoctor;
  } catch {
    return Response.json({ error: 'El cuerpo de la solicitud no es JSON válido.' }, { status: 400, headers: corsHeaders });
  }
  if (
    typeof input.nombre !== 'string' ||
    !input.nombre.trim() ||
    typeof input.especialidad !== 'string' ||
    !input.especialidad.trim() ||
    typeof input.cedula !== 'string' ||
    !input.cedula.trim() ||
    typeof input.email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) ||
    typeof input.passwordTemporal !== 'string' ||
    input.passwordTemporal.length < 8 ||
    !['activa', 'inactiva'].includes(input.suscripcion)
  ) {
    return Response.json({ error: 'Los datos del doctor no son válidos; la contraseña debe tener al menos 8 caracteres.' }, { status: 400, headers: corsHeaders });
  }

  const email = input.email.trim().toLowerCase();
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: input.passwordTemporal,
    email_confirm: true,
    user_metadata: { nombre: input.nombre.trim() },
  });
  if (createError || !created.user) {
    return Response.json({ error: `No se pudo crear el usuario: ${createError?.message ?? 'respuesta vacía.'}` }, { status: 400, headers: corsHeaders });
  }

  const doctorId = created.user.id;
  const { data: profile, error: profileInsertError } = await adminClient.from('perfiles').insert({
    id: doctorId,
    email,
    nombre: input.nombre.trim(),
    rol: 'DOCTOR',
    cedula: input.cedula.trim(),
    especialidad: input.especialidad.trim(),
    suscripcion_estado: input.suscripcion,
  }).select('id, nombre, email, cedula, especialidad, suscripcion_estado, created_at').single();
  if (profileInsertError || !profile) {
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(doctorId);
    return Response.json({
      error: `No se pudo crear el perfil: ${profileInsertError?.message ?? 'respuesta vacía.'}` +
        (rollbackError ? ` Tampoco se pudo eliminar la cuenta parcial: ${rollbackError.message}` : ''),
    }, { status: 500, headers: corsHeaders });
  }

  return Response.json({
    id: profile.id,
    nombre: profile.nombre,
    email: profile.email,
    especialidad: profile.especialidad,
    cedula: profile.cedula,
    suscripcion: profile.suscripcion_estado,
    fechaAlta: profile.created_at,
  }, { headers: corsHeaders });
}

Deno.serve(async (request: Request) => {
  try {
    return await manejarSolicitud(request);
  } catch (error) {
    console.error('No se pudo completar el alta del doctor.', error);
    return Response.json({
      error: `No se pudo completar el alta del doctor: ${error instanceof Error ? error.message : 'error desconocido.'}`,
    }, { status: 500, headers: corsHeaders });
  }
});
