const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

// 1. Cargar variables de entorno desde .env en la raíz
const env = {};
try {
  const envPath = path.join(__dirname, '..', '.env');
  const envFile = fs.readFileSync(envPath, 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch (e) {
  console.error('❌ Error leyendo archivo .env:', e.message);
  process.exit(1);
}

const url = env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const doctorEmail = 'morquecho17luis@gmail.com';
const doctorPassword = 'Luis2026@';

if (!url || !key) {
  console.error('❌ Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY en .env');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

let doctorId = null;
let patientId = null;
const today = new Date().toISOString().slice(0, 10);
const nowIso = new Date().toISOString();

const results = {};
const errorsLog = [];

function logStep(moduleName, success, errorDetails = null) {
  results[moduleName] = success ? '✅ PASS' : '❌ FAIL';
  if (!success && errorDetails) {
    errorsLog.push({ modulo: moduleName, error: errorDetails });
  }
}

async function runE2E() {
  console.log('🚀 INICIANDO PRUEBA INTEGRAL E2E DE MÓDULOS (PERSISTENTE)\n');

  // --- FASE 1: AUTHENTICATION ---
  try {
    const { data: authData, error: authErr } = await db.auth.signInWithPassword({
      email: doctorEmail,
      password: doctorPassword,
    });
    if (authErr) throw new Error(`Auth Login Error: ${authErr.message}`);
    
    doctorId = authData.user.id;
    console.log(`🔑 Login exitoso como Doctor ID: ${doctorId}`);

    logStep('1. Autenticación Doctor', true);
  } catch (err) {
    logStep('1. Autenticación Doctor', false, err.message);
    console.error('❌ Falló la fase de Autenticación. Abortando pruebas.');
    printReport();
    return;
  }

  // --- FASE 2: BÚSQUEDA O CREACIÓN DE PEDRO SANCHEZ ---
  try {
    const { data: existente, error: busqErr } = await db
      .from('pacientes')
      .select('id, nombre')
      .ilike('nombre', '%Pedro Sanchez%')
      .limit(1)
      .maybeSingle();

    if (busqErr) throw busqErr;

    if (existente) {
      patientId = existente.id;
      console.log(`👤 Utilizando paciente existente: ${existente.nombre} (ID: ${patientId})`);
    } else {
      patientId = crypto.randomUUID();
      const { error: insErr } = await db.from('pacientes').insert({
        id: patientId,
        doctor_id: doctorId,
        nombre: 'Pedro Sanchez',
        edad: 30,
        telefono: '4494381893',
        correo: 'pedro.sanchez@odontoapp.test',
        fecha_nacimiento: '1996-05-20',
        sexo: 'Masculino',
        motivo_consulta: 'preuba'
      });
      if (insErr) throw insErr;
      console.log(`👤 Creado nuevo paciente Pedro Sanchez (ID: ${patientId})`);
    }

    logStep('2. Localización/Creación de Paciente', true);
  } catch (err) {
    logStep('2. Localización/Creación de Paciente', false, err.message);
  }

  // --- FASE 3: AGENDA / CITAS ---
  try {
    const { data: cita, error: citaErr } = await db.from('citas').insert({
      doctor_id: doctorId,
      paciente_id: patientId,
      fecha: today,
      hora: '16:30',
      fecha_hora: nowIso,
      motivo_consulta: 'Evaluación y Limpieza',
      tratamiento_previsto: 'Resina Fotocurable',
      estatus: 'programada',
      notas_agenda: 'Prueba de sincronización con asistente',
      creado_por: doctorId
    }).select().single();

    if (citaErr) throw citaErr;
    logStep('3. Módulo Agenda & Citas', true);
  } catch (err) {
    logStep('3. Módulo Agenda & Citas', false, err.message);
  }

  // --- FASE 4: HISTORIA CLÍNICA (Sincronizado con UI) ---
  try {
    const { error: hcErr } = await db.from('historias_clinicas').upsert({
      doctor_id: doctorId,
      paciente_id: patientId,
      motivo_consulta: 'preuba',
      datos: {
        fechaNacimiento: '1996-05-20',
        sexo: 'Masculino',
        estadoCivil: 'Soltero',
        domicilio: 'Av. Convencion 123',
        colonia: 'Centro'
      }
    }, { onConflict: 'paciente_id' });

    if (hcErr) throw hcErr;
    logStep('4. Módulo Historia Clínica', true);
  } catch (err) {
    logStep('4. Módulo Historia Clínica', false, err.message);
  }

  // --- FASE 5: NOTAS DE EVOLUCIÓN (Sincronizado con columna fecha) ---
  try {
    const { error: notaErr } = await db.from('notas_evolucion').insert({
      doctor_id: doctorId,
      paciente_id: patientId,
      fecha: nowIso,
      procedimiento_realizado: 'Profilaxis y aplicación de flúor',
      diagnostico: 'Gingivitis leve generalizada',
      pronostico: 'Favorable'
    });

    if (notaErr) throw notaErr;
    logStep('5. Módulo Notas de Evolución', true);
  } catch (err) {
    logStep('5. Módulo Notas de Evolución', false, err.message);
  }

  // --- FASE 6: RECETAS & MEDICAMENTOS (Sincronizado con UI) ---
  try {
    const medicamentosJson = [
      {
        medicamento: 'Amoxicilina',
        dosis: '500 mg',
        frecuencia: 'Cada 8 horas',
        duracion: '7 días',
        indicaciones: 'Tomar después de los alimentos'
      }
    ];

    const { error: recErr } = await db.from('recetas').insert({
      doctor_id: doctorId,
      paciente_id: patientId,
      diagnostico_motivo: 'Infección Odontogénica Aguda',
      medicamentos: medicamentosJson,
      cuidados_recomendaciones: 'Evitar alimentos irritantes y bebidas muy calientes'
    });

    if (recErr) throw recErr;
    logStep('6. Módulo Recetas & Medicamentos', true);
  } catch (err) {
    logStep('6. Módulo Recetas & Medicamentos', false, err.message);
  }

  // --- FASE 7: TRATAMIENTOS & PAGOS / ABONOS (Sincronizado con UI) ---
  try {
    const { data: trat, error: tratErr } = await db.from('tratamientos').insert({
      doctor_id: doctorId,
      paciente_id: patientId,
      nombre_tratamiento: 'Rehabilitación con corona',
      descripcion: 'Detalles clínicos y notas de la corona',
      costo_total: 2500.00,
      estado: 'En Proceso'
    }).select().single();

    if (tratErr) throw tratErr;

    const { error: pagoErr } = await db.from('pagos_abonos').insert({
      doctor_id: doctorId,
      tratamiento_id: trat.id,
      monto: 1000.00,
      fecha: today,
      metodo_pago: 'Efectivo',
      nota_concepto: 'Anticipo para elaboración de corona'
    });

    if (pagoErr) throw pagoErr;
    logStep('7. Módulo Tratamientos y Pagos / Abonos', true);
  } catch (err) {
    logStep('7. Módulo Tratamientos y Pagos / Abonos', false, err.message);
  }

  // --- FASE 8: STORAGE & RADIOGRAFÍAS / GALERÍA ---
  try {
    const storagePath = `expedientes/${patientId}/radiografia_inicial.png`;
    const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV3sAAAAASUVORK5CYII=', 'base64');
    
    const { error: uploadErr } = await db.storage.from('expedientes').upload(storagePath, dummyBuffer, {
      contentType: 'image/png',
      upsert: true
    });

    if (uploadErr) throw uploadErr;

    const { error: metaErr } = await db.from('archivos_pacientes').insert({
      doctor_id: doctorId,
      paciente_id: patientId,
      tipo: 'Radiografía',
      descripcion: 'Radiografía periapical inicial OD 16',
      url_archivo: storagePath
    });

    if (metaErr) throw metaErr;
    logStep('8. Módulo Storage & Galería', true);
  } catch (err) {
    logStep('8. Módulo Storage & Galería', false, err.message);
  }

  // --- FASE 9: ODONTOGRAMA ---
  try {
    const piezasMock = {
      '16': { estado: 'caries', caras: ['Oclusal'] },
      '21': { estado: 'obturacion', caras: ['Mesial'] }
    };

    const { error: odontErr } = await db.from('odontogramas').upsert({
      doctor_id: doctorId,
      paciente_id: patientId,
      piezas: piezasMock,
      observaciones: 'Caries activa en pieza 16 y obturación previa en 21'
    }, { onConflict: 'paciente_id' });

    if (odontErr) throw odontErr;
    logStep('9. Módulo Odontograma', true);
  } catch (err) {
    logStep('9. Módulo Odontograma', false, err.message);
  }

  printReport();
}

function printReport() {
  console.log('\n======================================================');
  console.log('         REPORTE DE VALIDACIÓN E2E DE MÓDULOS         ');
  console.log('======================================================');
  for (const [modulo, estado] of Object.entries(results)) {
    console.log(`${modulo.padEnd(42)} | ${estado}`);
  }
  console.log('------------------------------------------------------');

  if (errorsLog.length > 0) {
    console.log('\n⚠️  ERRORES DETECTADOS Y CAMPOS/TABLAS FALTANTES:\n');
    errorsLog.forEach((item, index) => {
      console.log(`${index + 1}. [${item.modulo}]`);
      console.log(`   ❌ Detalle del Error: ${item.error}\n`);
    });
  } else {
    console.log('\n🎉 ¡TODOS LOS MÓDULOS Y COLUMNAS HAN SIDO VERIFICADOS EXITOSAMENTE!');
    console.log('💡 Los datos se conservaron en la BD para que puedas validarlos desde la UI.');
  }
  console.log('======================================================\n');
}

runE2E();