import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Falta encabezado de autorización' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Cliente para validar la sesión del usuario que llama (SuperAdmin)
    const callerClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: caller, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !caller.user) {
      return new Response(
        JSON.stringify({ error: 'Sesión no válida' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Cliente con Service Role para crear usuarios y saltar RLS
    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Validar si el llamante es SUPER_ADMIN
    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from('perfiles')
      .select('rol')
      .eq('id', caller.user.id)
      .single()

    if (callerProfileError || callerProfile?.rol !== 'SUPER_ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Acceso exclusivo para SuperAdmin' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const body = await req.json()
    const { email, passwordTemporal, nombre, cedula, especialidad, suscripcion } = body

    if (!email || !passwordTemporal) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: passwordTemporal,
      email_confirm: true,
      user_metadata: { nombre: nombre?.trim(), rol: 'DOCTOR' },
    })

    if (authError) throw authError

    // 2. Upsert en tabla perfiles (usando doctorProfile)
    const { data: doctorProfile, error: profileError } = await adminClient
      .from('perfiles')
      .upsert({
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        nombre: nombre?.trim(),
        rol: 'DOCTOR',
        cedula: cedula?.trim(),
        especialidad: especialidad?.trim(),
        suscripcion_estado: suscripcion || 'activa',
      })
      .select()
      .single()

    if (profileError) throw profileError

    return new Response(
      JSON.stringify(doctorProfile),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})