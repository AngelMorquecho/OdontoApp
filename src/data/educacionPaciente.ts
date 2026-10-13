export type CategoriaEducativa =
  | 'Prevención'
  | 'Tratamientos restauradores'
  | 'Tratamientos especializados'
  | 'Encías y periodoncia';

export interface TemaEducativo {
  id: string;
  titulo: string;
  categoria: CategoriaEducativa;
  descripcionCorta: string;
  explicacionDetallada: string;
  pasosTratamiento: string[];
  recomendacionesPostTratamiento: string[];
  svgIlustracion: string;
}

export const TEMAS_EDUCACION_PACIENTE: TemaEducativo[] = [
  {
    id: 'caries-dental',
    titulo: 'Caries dental',
    categoria: 'Prevención',
    descripcionCorta: 'Qué es la caries, cómo se detecta y por qué conviene atenderla a tiempo.',
    explicacionDetallada:
      'La caries es el daño progresivo de los tejidos del diente asociado a los ácidos que producen las bacterias de la placa al utilizar azúcares. Puede comenzar como una lesión pequeña y avanzar hacia capas más profundas. En etapas iniciales quizá no cause molestias; el odontólogo la valora mediante exploración y, cuando hace falta, radiografías. El cuidado diario y las revisiones ayudan a prevenirla o detectarla temprano.',
    pasosTratamiento: [
      'Se revisa el diente y se determina la extensión de la lesión.',
      'Si se necesita, se toma una radiografía y se explica el plan.',
      'Para una lesión cavitada, se retira el tejido afectado y se restaura el diente.',
      'Si la lesión es profunda, puede requerirse otro tratamiento, como una endodoncia.',
    ],
    recomendacionesPostTratamiento: [
      'Cepíllate con pasta con flúor y limpia entre los dientes todos los días.',
      'Modera la frecuencia de bebidas y alimentos azucarados.',
      'Sigue la indicación de revisión que te dé tu odontólogo.',
      'Consulta si aparece dolor persistente, inflamación o sensibilidad que empeora.',
    ],
    svgIlustracion: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150">
      <rect width="320" height="150" rx="18" fill="#F2F8FE"/>
      <path d="M73 38c-21-17-45-2-40 24 4 19 13 29 19 52 4 13 15 13 18 0l7-23 7 23c4 13 14 13 18 0 6-23 15-33 19-52 5-26-19-41-40-24-3 2-5 2-8 0Z" fill="#fff" stroke="#607D8B" stroke-width="4"/>
      <circle cx="55" cy="62" r="8" fill="#EF5350"/><path d="M153 75h42" stroke="#90A4AE" stroke-width="4" stroke-linecap="round"/><path d="m187 64 12 11-12 11" fill="none" stroke="#90A4AE" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M245 38c-21-17-45-2-40 24 4 19 13 29 19 52 4 13 15 13 18 0l7-23 7 23c4 13 14 13 18 0 6-23 15-33 19-52 5-26-19-41-40-24-3 2-5 2-8 0Z" fill="#fff" stroke="#607D8B" stroke-width="4"/>
      <path d="M226 61h18v13h-18z" fill="#64B5F6"/><text x="160" y="137" text-anchor="middle" font-family="Arial" font-size="13" fill="#455A64">Detección temprana · cuidado · restauración</text>
    </svg>`,
  },
  {
    id: 'endodoncia',
    titulo: 'Endodoncia',
    categoria: 'Tratamientos especializados',
    descripcionCorta: 'Tratamiento para limpiar el interior del diente cuando la pulpa está afectada.',
    explicacionDetallada:
      'La endodoncia trata el tejido blando que se encuentra dentro del diente (la pulpa) cuando está inflamado o infectado. Su objetivo es limpiar y sellar los conductos para conservar el diente. El diagnóstico y la decisión dependen de cada caso; en ocasiones se recomienda una restauración adicional para proteger la pieza.',
    pasosTratamiento: [
      'Se evalúa el diente y se explica el diagnóstico y las alternativas.',
      'Se anestesia la zona cuando está indicado y se aísla el diente.',
      'Se limpia y desinfecta el espacio interno y sus conductos.',
      'Se sellan los conductos y se coloca una restauración provisional o definitiva.',
      'Se programa seguimiento y, si corresponde, una restauración protectora.',
    ],
    recomendacionesPostTratamiento: [
      'Sigue las indicaciones que recibas y acude a las citas de seguimiento.',
      'Evita masticar alimentos duros con el diente si tiene una restauración provisional.',
      'Es posible sentir sensibilidad temporal; contacta a tu odontólogo si es intensa, persiste o aumenta.',
      'No pospongas la restauración definitiva recomendada.',
    ],
    svgIlustracion: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150">
      <rect width="320" height="150" rx="18" fill="#F5F7FB"/>
      <path d="M93 30c-21-17-45-2-40 24 4 19 13 29 19 70 4 13 15 13 18 0l7-35 7 35c4 13 14 13 18 0 6-41 15-51 19-70 5-26-19-41-40-24-3 2-5 2-8 0Z" fill="#fff" stroke="#607D8B" stroke-width="4"/>
      <path d="M93 55v58m0-42-13 24m13-24 13 24" stroke="#EF6C64" stroke-width="6" stroke-linecap="round"/>
      <path d="M174 73h38" stroke="#90A4AE" stroke-width="4" stroke-linecap="round"/><path d="m204 62 12 11-12 11" fill="none" stroke="#90A4AE" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M242 30c-21-17-45-2-40 24 4 19 13 29 19 70 4 13 15 13 18 0l7-35 7 35c4 13 14 13 18 0 6-41 15-51 19-70 5-26-19-41-40-24-3 2-5 2-8 0Z" fill="#fff" stroke="#607D8B" stroke-width="4"/>
      <path d="M242 57v56m0-41-12 23m12-23 12 23" stroke="#64B5F6" stroke-width="5" stroke-linecap="round"/>
      <text x="160" y="139" text-anchor="middle" font-family="Arial" font-size="13" fill="#455A64">Limpieza y sellado de conductos</text>
    </svg>`,
  },
  {
    id: 'limpieza-periodoncia',
    titulo: 'Limpieza y periodoncia',
    categoria: 'Encías y periodoncia',
    descripcionCorta: 'Cómo se remueve placa y cálculo y se cuida la salud de las encías.',
    explicacionDetallada:
      'La limpieza profesional remueve depósitos que no siempre se eliminan con el cepillado. Si existe enfermedad periodontal, el profesional puede indicar una limpieza profunda debajo de la encía y un plan de mantenimiento. La profundidad del tratamiento depende de la evaluación de las encías, y el cuidado en casa es parte esencial del resultado.',
    pasosTratamiento: [
      'Se revisan las encías y se mide su condición para planificar el cuidado.',
      'Se retiran placa y depósitos de las superficies dentales.',
      'Si está indicado, se limpian cuidadosamente las superficies debajo de la encía.',
      'Se revisa la respuesta y se acuerdan controles y mantenimiento.',
    ],
    recomendacionesPostTratamiento: [
      'Cepilla suavemente la línea de la encía y limpia entre dientes a diario.',
      'Puede haber sensibilidad o molestia leve temporal; sigue las instrucciones recibidas.',
      'Evita fumar, ya que puede afectar la salud de las encías.',
      'Asiste a los controles de mantenimiento recomendados.',
    ],
    svgIlustracion: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150">
      <rect width="320" height="150" rx="18" fill="#F2FAF7"/>
      <path d="M38 94q38-28 76 0v22H38z" fill="#F48FB1"/><path d="M48 49h24v57H48zM82 49h24v57H82z" rx="8" fill="#fff" stroke="#607D8B" stroke-width="3"/>
      <circle cx="71" cy="91" r="5" fill="#B0BEC5"/><circle cx="89" cy="87" r="5" fill="#B0BEC5"/>
      <path d="M150 77h42" stroke="#90A4AE" stroke-width="4" stroke-linecap="round"/><path d="m184 66 12 11-12 11" fill="none" stroke="#90A4AE" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M208 94q38-28 76 0v22h-76z" fill="#F48FB1"/><path d="M218 49h24v57h-24zM252 49h24v57h-24z" rx="8" fill="#fff" stroke="#607D8B" stroke-width="3"/>
      <path d="M69 80v21m18-21v21" stroke="#26A69A" stroke-width="4" stroke-linecap="round"/>
      <text x="160" y="139" text-anchor="middle" font-family="Arial" font-size="13" fill="#455A64">Encías cuidadas · higiene · mantenimiento</text>
    </svg>`,
  },
  {
    id: 'resinas',
    titulo: 'Resinas',
    categoria: 'Tratamientos restauradores',
    descripcionCorta: 'Restauraciones del color del diente para reparar zonas dañadas.',
    explicacionDetallada:
      'La resina compuesta es un material del color del diente que puede utilizarse para reparar caries u otros defectos pequeños o moderados. El odontólogo prepara la zona necesaria, coloca el material por capas y lo adapta para recuperar la forma y función. La indicación y durabilidad dependen del tamaño, ubicación y hábitos de cada paciente.',
    pasosTratamiento: [
      'Se valora el diente y se elige el material adecuado.',
      'Se limpia y prepara la superficie; se usa anestesia si hace falta.',
      'Se coloca la resina en capas y se endurece con una lámpara.',
      'Se ajusta la mordida y se pule la restauración.',
    ],
    recomendacionesPostTratamiento: [
      'Si recibiste anestesia, espera a que pase el adormecimiento antes de masticar.',
      'Una sensibilidad breve puede ocurrir; pide revisión si es persistente o empeora.',
      'Mantén la higiene habitual y evita usar los dientes para abrir objetos.',
      'Consulta si notas que la restauración se fractura o interfiere al morder.',
    ],
    svgIlustracion: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150">
      <rect width="320" height="150" rx="18" fill="#F2F8FE"/>
      <path d="M103 32c-21-17-45-2-40 24 4 19 13 29 19 68 4 13 15 13 18 0l7-34 7 34c4 13 14 13 18 0 6-39 15-49 19-68 5-26-19-41-40-24-3 2-5 2-8 0Z" fill="#fff" stroke="#607D8B" stroke-width="4"/>
      <path d="M85 59h27v17H85z" fill="#64B5F6"/><path d="M190 52h42v30h-42z" rx="7" fill="#BBDEFB" stroke="#1E88E5" stroke-width="3"/><path d="m201 67 9 9 17-20" fill="none" stroke="#1E88E5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="160" y="123" text-anchor="middle" font-family="Arial" font-size="13" fill="#455A64">Capas de resina · ajuste · pulido</text>
    </svg>`,
  },
  {
    id: 'implantes',
    titulo: 'Implantes dentales',
    categoria: 'Tratamientos especializados',
    descripcionCorta: 'Una opción para reemplazar una pieza ausente mediante una raíz artificial.',
    explicacionDetallada:
      'Un implante dental es un dispositivo que se coloca en el hueso para servir de soporte a una restauración. La planificación requiere valorar la salud general, el hueso y las encías; no todas las personas son candidatas en las mismas condiciones. El proceso suele realizarse por etapas y el tiempo de integración varía entre pacientes.',
    pasosTratamiento: [
      'Se realiza una valoración clínica y de imágenes para planificar el caso.',
      'Si es apropiado, se coloca el implante y se permite su integración según el plan.',
      'Se revisa la cicatrización y se planifica la restauración.',
      'Se coloca la corona u otra prótesis y se establece un programa de mantenimiento.',
    ],
    recomendacionesPostTratamiento: [
      'Sigue exactamente las indicaciones del equipo que realizó el procedimiento.',
      'Mantén la higiene de la zona de forma cuidadosa según te indiquen.',
      'Acude a las revisiones y al mantenimiento; los implantes también requieren cuidado.',
      'Comunícate con tu clínica ante sangrado que no cede, fiebre, inflamación creciente o dolor intenso.',
    ],
    svgIlustracion: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150">
      <rect width="320" height="150" rx="18" fill="#F4F8FC"/>
      <path d="M70 48c-18-15-40-1-36 21 4 16 12 25 17 47 4 11 13 11 16 0l7-20 7 20c3 11 12 11 16 0 5-22 13-31 17-47 4-22-18-36-36-21-3 2-5 2-8 0Z" fill="#fff" stroke="#607D8B" stroke-width="4"/>
      <path d="M67 83v37m16-37v37m-16-27h16m-16 9h16m-16 9h16" stroke="#90A4AE" stroke-width="4"/>
      <path d="M231 39c-18-15-40-1-36 21 4 16 12 25 17 47 4 11 13 11 16 0l7-20 7 20c3 11 12 11 16 0 5-22 13-31 17-47 4-22-18-36-36-21-3 2-5 2-8 0Z" fill="#fff" stroke="#607D8B" stroke-width="4"/>
      <path d="M228 78v47m16-47v47m-16-35h16m-16 9h16m-16 9h16m-16 9h16" stroke="#1E88E5" stroke-width="4"/><path d="M236 75v-8" stroke="#1E88E5" stroke-width="5"/>
      <text x="160" y="141" text-anchor="middle" font-family="Arial" font-size="13" fill="#455A64">Planificación · implante · restauración</text>
    </svg>`,
  },
  {
    id: 'coronas',
    titulo: 'Coronas dentales',
    categoria: 'Tratamientos restauradores',
    descripcionCorta: 'Una cubierta que protege y recupera la forma de un diente debilitado.',
    explicacionDetallada:
      'Una corona cubre la parte visible de un diente para ayudar a restaurar su forma, resistencia y función. Puede recomendarse cuando una pieza está muy dañada o después de ciertos tratamientos. El tipo de material y el proceso dependen de la evaluación, la mordida y las necesidades particulares.',
    pasosTratamiento: [
      'Se valora el diente y se conversa sobre los materiales y alternativas.',
      'Se prepara la pieza y se toma un registro para fabricar la corona.',
      'Se coloca una corona provisional mientras se prepara la definitiva, si se requiere.',
      'Se prueba, ajusta y cementa la corona definitiva según el plan.',
    ],
    recomendacionesPostTratamiento: [
      'Cuida la corona y la encía que la rodea con cepillado e higiene interdental.',
      'Evita morder objetos muy duros y no utilices los dientes como herramientas.',
      'Acude a revisión si la corona se siente floja, se fractura o cambia tu mordida.',
      'Si tienes una provisional, sigue las recomendaciones específicas para protegerla.',
    ],
    svgIlustracion: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150">
      <rect width="320" height="150" rx="18" fill="#F5F8FA"/>
      <path d="M88 47c-21-17-45-2-40 24 4 19 13 29 19 52 4 13 15 13 18 0l7-23 7 23c4 13 14 13 18 0 6-23 15-33 19-52 5-26-19-41-40-24-3 2-5 2-8 0Z" fill="#fff" stroke="#607D8B" stroke-width="4"/>
      <path d="M65 49q23-18 46 0l-4 29H69z" fill="#FFD54F" stroke="#F9A825" stroke-width="3"/>
      <path d="M185 70h37" stroke="#90A4AE" stroke-width="4" stroke-linecap="round"/><path d="m214 59 12 11-12 11" fill="none" stroke="#90A4AE" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M250 47c-21-17-45-2-40 24 4 19 13 29 19 52 4 13 15 13 18 0l7-23 7 23c4 13 14 13 18 0 6-23 15-33 19-52 5-26-19-41-40-24-3 2-5 2-8 0Z" fill="#fff" stroke="#607D8B" stroke-width="4"/>
      <path d="M227 49q23-18 46 0l-4 29h-38z" fill="#FFD54F" stroke="#F9A825" stroke-width="3"/>
      <text x="160" y="139" text-anchor="middle" font-family="Arial" font-size="13" fill="#455A64">Protección y recuperación de la función</text>
    </svg>`,
  },
];
