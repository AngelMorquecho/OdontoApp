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

/**
 * Función de comparación recursiva agnóstica al orden de las llaves en JSON
 */
function sonObjetosIguales(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!sonObjetosIguales(obj1[key], obj2[key])) return false;
  }
  return true;
}

async function runE2EHistoriaClinica() {
  console.log('🚀 INICIANDO PRUEBA E2E: LLENADO COMPLETO Y TOTAL DE TODOS LOS COMPONENTES DE HISTORIA CLÍNICA\n');

  let doctorId = null;
  let patientId = null;

  try {
    // FASE 1: AUTHENTICATION DOCTOR
    const { data: authData, error: authErr } = await db.auth.signInWithPassword({
      email: doctorEmail,
      password: doctorPassword,
    });
    if (authErr) throw new Error(`Error de Autenticación: ${authErr.message}`);
    
    doctorId = authData.user.id;
    console.log(`🔑 Login exitoso como Doctor ID: ${doctorId}`);

    // FASE 2: CREACIÓN DE PACIENTE TEMPORAL
    patientId = crypto.randomUUID();
    const nombreTemp = `Paciente Test HC Final ${Date.now()}`;
    const { error: insPacErr } = await db.from('pacientes').insert({
      id: patientId,
      doctor_id: doctorId,
      nombre: nombreTemp,
      edad: 30,
      telefono: '4491234567',
      correo: 'test.hc.final@odontoapp.test',
      fecha_nacimiento: '1996-05-20',
      creado_por: doctorId
    });

    if (insPacErr) throw new Error(`Error creando paciente de prueba: ${insPacErr.message}`);
    console.log(`👤 Paciente temporal creado: ${nombreTemp} (ID: ${patientId})`);

    // FASE 3: ESTRUCTURA EXACTA CON TODOS LOS CAMPOS DE LOS 5 COMPONENTES
    const historiaClinicaE2ECompleta = {
      // 1. SeccionDatosGenerales
      identificacion: {
        fechaNacimiento: '1996-05-20',
        sexo: 'F', // Se usa 'F' para validar también los campos Gineco-Obstétricos
        estadoCivil: 'Soltera',
        domicilio: 'Av. Convencion 123',
        colonia: 'Centro',
        cp: '20000',
        ciudad: 'Aguascalientes',
        ocupacion: 'Diseñadora Industrial',
        escolaridad: 'Licenciatura',
        lugarResidencia: 'Aguascalientes, Ags.'
      },

      // 2. SeccionFactoresRiesgo
      factoresRiesgo: {
        tipoVivienda: 'Casa habitación',
        zona: 'Urbana',
        servicios: 'Agua, luz, drenaje, internet',
        tabaquismo: {
          consume: 'si',
          frecuencia: '3 cigarros al día',
          tiempo: '2 años'
        },
        alcohol: {
          consume: 'si',
          frecuencia: 'Ocasional en reuniones',
          tiempo: '5 años'
        },
        drogas: {
          consume: 'no',
          frecuencia: '',
          tiempo: ''
        },
        higieneOral: {
          frecuencia: '3 veces al día',
          calidad: 'buena'
        }
      },
      antecedentesHeredofamiliares: {
        diabetes: 'si',
        hipertension: 'si',
        cardiopatias: 'no',
        cancer: 'no',
        especifique: 'Abuela materna con diabetes e hipertensión arterial.'
      },

      // 3. SeccionMedicos
      antecedentesMedicos: {
        diabetes: 'no',
        hipertension: 'no',
        asma: 'no',
        epilepsia: 'no',
        coagulacion: 'no',
        renal: 'no',
        hepatica: 'no',
        tiroidea: 'no',
        alergias: {
          medicamentos: 'si',
          alimentos: 'no',
          latex: 'no',
          especifique: 'Alergia severa a la Penicilina.'
        },
        medicamentosActuales: 'Ninguno actualmente.',
        medicoTratante: 'Dr. Alejandro Gomez (Médico General)'
      },
      ginecoObstetricos: {
        embarazada: 'si',
        semanas: '12',
        lactancia: 'no',
        metodoAnticonceptivo: 'Ninguno por embarazo'
      },
      antecedentesOdontologicos: {
        ultimaVisita: 'Hace 6 meses',
        tratamientosPrevios: 'Limpieza dental y resina simple',
        experienciaAnestesia: 'Buena, sin reacciones adversas'
      },
      signosVitales: {
        ta: '118/78',
        fc: '72',
        fr: '18',
        temperatura: '36.5'
      },

      // 4. SeccionExploracion
      exploracionClinica: {
        extraoral: {
          cabezaCuello: 'Normocéfalo, simetría facial conservada, piel de aspecto sano.',
          atm: 'Movimientos condíleos simétricos, sin crepitación ni dolor a la palpación.',
          ganglios: 'Cadenas ganglionares cervicales y submandibulares sin linfadenopatías.'
        },
        intraoral: {
          labios: 'Labios simétricos, hidratados, de coloración uniforme.',
          encia: 'Encía marginal rosa coral, ligera inflamación en papilas inferiores.',
          lengua: 'Lengua saburral leve en dorso, bordes limpios.',
          placa: 'Índice de placa bajo en caras vestibulares.',
          calculo: 'Presencia de cálculo supragingival leve en lingual de anteroinferiores.',
          relacionOclusal: 'Clase I de Angle molar y canina.'
        }
      },
      evaluacionPeriodontal: {
        estadoPeriodontal: 'Gingivitis leve asociada a placa dentobacteriana.',
        hallazgos: 'Sondeo máximo de 2.5mm, sangrado leve al sondeo en zona de molares.'
      },

      // 5. SeccionDiagnostico
      diagnosticoPlan: {
        diagnosticos: '1. Caries incipiente en OD 16 (Oclusal)\n2. Gingivitis leve asociada a placa dentobacteriana',
        pronostico: 'Favorable',
        planTratamiento: '1. Profilaxis ultrasónica y control de placa\n2. Restauración con resina en OD 16\n3. Instrucción de técnica de cepillado',
        objetivoGeneral: 'Mantener la salud periodontal y eliminar lesiones cariosas activas.'
      }
    };

    // FASE 4: GUARDAR EN LA BASE DE DATOS
    const { error: hcErr } = await db.from('historias_clinicas').upsert({
      doctor_id: doctorId,
      paciente_id: patientId,
      datos: historiaClinicaE2ECompleta
    }, { onConflict: 'paciente_id' });

    if (hcErr) throw new Error(`Error guardando Historia Clínica: ${hcErr.message}`);
    console.log('📝 Historia clínica guardada exitosamente con TODOS los campos de los 5 componentes UI.');

    // FASE 5: CONSULTAR Y VALIDAR
    const { data: hcGuardada, error: queryErr } = await db
      .from('historias_clinicas')
      .select('datos')
      .eq('paciente_id', patientId)
      .single();

    if (queryErr || !hcGuardada) throw new Error(`Error consultando la historia guardada: ${queryErr?.message}`);

    console.log('🔍 Verificando integridad de los campos guardados...');
    
    const guardado = hcGuardada.datos || {};
    const diferencias = [];

    for (const key of Object.keys(historiaClinicaE2ECompleta)) {
      const esIgual = sonObjetosIguales(historiaClinicaE2ECompleta[key], guardado[key]);

      if (!esIgual) {
        diferencias.push({
          seccionComponente: key,
          enviado: historiaClinicaE2ECompleta[key],
          obtenido: guardado[key]
        });
      }
    }

    if (diferencias.length > 0) {
      console.log('\n❌ DIFERENCIAS ENCONTRADAS EN LOS COMPONENTES:');
      console.dir(diferencias, { depth: null, colors: true });
      throw new Error(`Se encontraron ${diferencias.length} secciones con diferencias entre la UI y la BD.`);
    }

    console.log('✅ Verificación exitosa: Todos los campos de TODOS los componentes UI coinciden al 100%.');

    // FASE 6: LIMPIEZA AUTOMÁTICA EN ÉXITO
    console.log('🧹 Limpiando base de datos (eliminando paciente de prueba)...');
    const { error: delErr } = await db
      .from('pacientes')
      .delete()
      .eq('id', patientId);

    if (delErr) {
      console.warn(`⚠️ Aviso: No se pudo eliminar el paciente de prueba: ${delErr.message}`);
    } else {
      console.log('✨ Registro eliminado de la base de datos de forma limpia.');
    }

    console.log('\n======================================================');
    console.log('🎉 RESULTADO PRUEBA E2E HISTORIA CLÍNICA (UI TOTAL): ✅ PASS');
    console.log('======================================================\n');

  } catch (error) {
    console.error('\n======================================================');
    console.error('❌ RESULTADO PRUEBA E2E HISTORIA CLÍNICA (UI TOTAL): ❌ FAIL');
    console.error(`Detalle del fallo: ${error.message}`);
    console.error('======================================================\n');

    // Limpieza de seguridad en caso de fallo
    if (patientId) {
      await db.from('pacientes').delete().eq('id', patientId);
    }
  }
}

runE2EHistoriaClinica();