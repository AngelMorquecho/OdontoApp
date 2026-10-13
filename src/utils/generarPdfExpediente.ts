import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import {
  CARAS,
  CaraDental,
  EstadoCara,
  INFERIOR,
  NumeroFDI,
  Odontograma,
  SUPERIOR,
} from '../components/types/odontograma';
import { NotaEvolucion, Paciente, SiNo } from '../types/paciente';

const DOCTOR_1 = 'Dr. Luis Morquecho García';
const DOCTOR_2 = 'Dra. Jacqueline Rodríguez Enríquez';

/** Escapa caracteres especiales para incrustar texto de usuario en HTML de forma segura. */
function escaparHtml(texto: string | undefined | null): string {
  if (!texto) return '';
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function textoOGuion(texto: string | undefined | null): string {
  const limpio = escaparHtml(texto);
  return limpio.length > 0 ? limpio : '—';
}

function badgeSiNo(valor: SiNo): string {
  const positivo = valor === 'si';
  return `<span class="badge ${positivo ? 'badge-si' : 'badge-no'}">${positivo ? 'Sí' : 'No'}</span>`;
}

function listaEstudios(estudios: NotaEvolucion['estudios']): string {
  const activos: string[] = [];
  if (estudios.rx) activos.push('Rx');
  if (estudios.fotos) activos.push('Fotos');
  if (estudios.escaneo) activos.push('Escaneo');
  if (estudios.cbct) activos.push('CBCT');
  return activos.length > 0 ? activos.join(', ') : 'Ninguno';
}

const ETIQUETAS_CARA: Record<CaraDental, string> = {
  vestibular: 'Vestibular',
  lingual: 'Lingual/Palatina',
  mesial: 'Mesial',
  distal: 'Distal',
  oclusal: 'Oclusal/Incisal',
};

interface RegistroCaraDental {
  numero: NumeroFDI;
  cara: CaraDental;
  estado: EstadoCara | undefined;
}

const ETIQUETAS_ESTADO: Record<EstadoCara, string> = {
  sana: 'Sana',
  caries: 'Caries',
  obturacion: 'Obturación',
};

/** Recorre las 32 piezas y conserva el estado de cada una de sus cinco caras. */
function obtenerCarasOdontograma(odontograma: Odontograma): RegistroCaraDental[] {
  const registros: RegistroCaraDental[] = [];
  const todos = [...SUPERIOR, ...INFERIOR];
  for (const numero of todos) {
    const diente = odontograma.dientes[numero];
    CARAS.forEach((cara) => {
      registros.push({ numero, cara, estado: diente?.caras?.[cara] });
    });
  }
  return registros;
}

function seccionEncabezadoConsultorio(paciente: Paciente): string {
  const fechaEmision = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `
    <div class="encabezado-consultorio">
      <h1>Expediente Clínico Odontológico</h1>
      <p class="doctores">${DOCTOR_1} &middot; ${DOCTOR_2}</p>
      <p class="fecha-emision">Fecha de emisión: ${escaparHtml(fechaEmision)}</p>
    </div>
    <div class="ficha-paciente">
      <h2>${escaparHtml(paciente.nombre)}</h2>
      <p>${paciente.edad} años &middot; ${escaparHtml(paciente.telefono)}</p>
      <p>Motivo de consulta: ${textoOGuion(paciente.motivoConsulta)}</p>
    </div>
  `;
}

function seccionDatosPersonales(paciente: Paciente): string {
  const { identificacion: i } = paciente.historiaClinica;
  return `
    <section>
      <h3>Datos personales</h3>
      <table class="tabla-datos">
        <tr><td>Fecha de nacimiento</td><td>${textoOGuion(i.fechaNacimiento)}</td></tr>
        <tr><td>Sexo</td><td>${i.sexo === 'F' ? 'Femenino' : 'Masculino'}</td></tr>
        <tr><td>Estado civil</td><td>${textoOGuion(i.estadoCivil)}</td></tr>
        <tr><td>Domicilio</td><td>${textoOGuion(i.domicilio)}, Col. ${textoOGuion(i.colonia)}, CP ${textoOGuion(i.cp)}</td></tr>
        <tr><td>Ciudad</td><td>${textoOGuion(i.ciudad)}</td></tr>
        <tr><td>Ocupación</td><td>${textoOGuion(i.ocupacion)}</td></tr>
        <tr><td>Escolaridad</td><td>${textoOGuion(i.escolaridad)}</td></tr>
        <tr><td>Lugar de residencia</td><td>${textoOGuion(i.lugarResidencia)}</td></tr>
      </table>
    </section>
  `;
}

function seccionAntecedentesMedicos(paciente: Paciente): string {
  const { antecedentesHeredofamiliares: h, antecedentesMedicos: m, factoresRiesgo: f } =
    paciente.historiaClinica;
  return `
    <section>
      <h3>Antecedentes heredofamiliares</h3>
      <table class="tabla-datos">
        <tr><td>Diabetes</td><td>${badgeSiNo(h.diabetes)}</td></tr>
        <tr><td>Hipertensión</td><td>${badgeSiNo(h.hipertension)}</td></tr>
        <tr><td>Cardiopatías</td><td>${badgeSiNo(h.cardiopatias)}</td></tr>
        <tr><td>Cáncer</td><td>${badgeSiNo(h.cancer)}</td></tr>
        <tr><td>Especifique</td><td>${textoOGuion(h.especifique)}</td></tr>
      </table>

      <h3>Antecedentes médicos personales</h3>
      <table class="tabla-datos">
        <tr><td>Diabetes</td><td>${badgeSiNo(m.diabetes)}</td></tr>
        <tr><td>Hipertensión</td><td>${badgeSiNo(m.hipertension)}</td></tr>
        <tr><td>Asma</td><td>${badgeSiNo(m.asma)}</td></tr>
        <tr><td>Epilepsia</td><td>${badgeSiNo(m.epilepsia)}</td></tr>
        <tr><td>Trastornos de coagulación</td><td>${badgeSiNo(m.coagulacion)}</td></tr>
        <tr><td>Enfermedad renal</td><td>${badgeSiNo(m.renal)}</td></tr>
        <tr><td>Enfermedad hepática</td><td>${badgeSiNo(m.hepatica)}</td></tr>
        <tr><td>Enfermedad tiroidea</td><td>${badgeSiNo(m.tiroidea)}</td></tr>
        <tr><td>Alergia a medicamentos</td><td>${badgeSiNo(m.alergias.medicamentos)}</td></tr>
        <tr><td>Alergia a alimentos</td><td>${badgeSiNo(m.alergias.alimentos)}</td></tr>
        <tr><td>Alergia al látex</td><td>${badgeSiNo(m.alergias.latex)}</td></tr>
        <tr><td>Especifique alergias</td><td>${textoOGuion(m.alergias.especifique)}</td></tr>
        <tr><td>Medicamentos actuales</td><td>${textoOGuion(m.medicamentosActuales)}</td></tr>
        <tr><td>Médico tratante</td><td>${textoOGuion(m.medicoTratante)}</td></tr>
      </table>

      <h3>Factores de riesgo</h3>
      <table class="tabla-datos">
        <tr><td>Tipo de vivienda</td><td>${textoOGuion(f.tipoVivienda)}</td></tr>
        <tr><td>Zona</td><td>${textoOGuion(f.zona)}</td></tr>
        <tr><td>Servicios</td><td>${textoOGuion(f.servicios)}</td></tr>
        <tr><td>Tabaquismo</td><td>${badgeSiNo(f.tabaquismo.consume)} ${textoOGuion(f.tabaquismo.frecuencia)} ${textoOGuion(f.tabaquismo.tiempo)}</td></tr>
        <tr><td>Alcohol</td><td>${badgeSiNo(f.alcohol.consume)} ${textoOGuion(f.alcohol.frecuencia)} ${textoOGuion(f.alcohol.tiempo)}</td></tr>
        <tr><td>Drogas</td><td>${badgeSiNo(f.drogas.consume)} ${textoOGuion(f.drogas.frecuencia)} ${textoOGuion(f.drogas.tiempo)}</td></tr>
        <tr><td>Higiene oral</td><td>${textoOGuion(f.higieneOral.frecuencia)} (${f.higieneOral.calidad})</td></tr>
      </table>
    </section>
  `;
}

function seccionAntecedentesGinecoObstetricos(paciente: Paciente): string {
  const antecedentes = paciente.historiaClinica.ginecoObstetricos;
  return `
    <section>
      <h3>Antecedentes gineco-obstétricos</h3>
      <table class="tabla-datos">
        <tr><td>Embarazo</td><td>${badgeSiNo(antecedentes.embarazada)}</td></tr>
        <tr><td>Semanas de gestación</td><td>${textoOGuion(antecedentes.semanas)}</td></tr>
        <tr><td>Lactancia</td><td>${badgeSiNo(antecedentes.lactancia)}</td></tr>
        <tr><td>Método anticonceptivo</td><td>${textoOGuion(antecedentes.metodoAnticonceptivo)}</td></tr>
      </table>
    </section>
  `;
}

function seccionAntecedentesOdontologicos(paciente: Paciente): string {
  const antecedentes = paciente.historiaClinica.antecedentesOdontologicos;
  return `
    <section>
      <h3>Antecedentes odontológicos</h3>
      <table class="tabla-datos">
        <tr><td>Última visita al odontólogo</td><td>${textoOGuion(antecedentes.ultimaVisita)}</td></tr>
        <tr><td>Tratamientos previos</td><td>${textoOGuion(antecedentes.tratamientosPrevios)}</td></tr>
        <tr><td>Experiencia con anestesia</td><td>${textoOGuion(antecedentes.experienciaAnestesia)}</td></tr>
      </table>
    </section>
  `;
}

function seccionExploracion(paciente: Paciente): string {
  const { exploracionClinica: ec, evaluacionPeriodontal: ep, signosVitales: sv, diagnosticoPlan: dp } =
    paciente.historiaClinica;
  return `
    <section>
      <h3>Signos vitales</h3>
      <table class="tabla-datos">
        <tr><td>Tensión arterial</td><td>${textoOGuion(sv.ta)}</td></tr>
        <tr><td>Frecuencia cardiaca</td><td>${textoOGuion(sv.fc)}</td></tr>
        <tr><td>Frecuencia respiratoria</td><td>${textoOGuion(sv.fr)}</td></tr>
        <tr><td>Temperatura</td><td>${textoOGuion(sv.temperatura)}</td></tr>
      </table>

      <h3>Exploración extraoral</h3>
      <table class="tabla-datos">
        <tr><td>Cabeza y cuello</td><td>${textoOGuion(ec.extraoral.cabezaCuello)}</td></tr>
        <tr><td>ATM</td><td>${textoOGuion(ec.extraoral.atm)}</td></tr>
        <tr><td>Ganglios</td><td>${textoOGuion(ec.extraoral.ganglios)}</td></tr>
      </table>

      <h3>Exploración intraoral</h3>
      <table class="tabla-datos">
        <tr><td>Labios</td><td>${textoOGuion(ec.intraoral.labios)}</td></tr>
        <tr><td>Encía</td><td>${textoOGuion(ec.intraoral.encia)}</td></tr>
        <tr><td>Lengua</td><td>${textoOGuion(ec.intraoral.lengua)}</td></tr>
        <tr><td>Placa dentobacteriana</td><td>${textoOGuion(ec.intraoral.placa)}</td></tr>
        <tr><td>Cálculo</td><td>${textoOGuion(ec.intraoral.calculo)}</td></tr>
        <tr><td>Relación oclusal</td><td>${textoOGuion(ec.intraoral.relacionOclusal)}</td></tr>
      </table>

      <h3>Evaluación periodontal</h3>
      <table class="tabla-datos">
        <tr><td>Estado periodontal</td><td>${textoOGuion(ep.estadoPeriodontal)}</td></tr>
        <tr><td>Hallazgos</td><td>${textoOGuion(ep.hallazgos)}</td></tr>
      </table>

      <h3>Diagnóstico y plan de tratamiento</h3>
      <table class="tabla-datos">
        <tr><td>Diagnósticos</td><td>${textoOGuion(dp.diagnosticos)}</td></tr>
        <tr><td>Pronóstico</td><td>${escaparHtml(dp.pronostico)}</td></tr>
        <tr><td>Plan de tratamiento</td><td>${textoOGuion(dp.planTratamiento)}</td></tr>
        <tr><td>Objetivo general</td><td>${textoOGuion(dp.objetivoGeneral)}</td></tr>
      </table>
    </section>
  `;
}


function seccionOdontograma(paciente: Paciente): string {
  const registros = obtenerCarasOdontograma(paciente.odontograma);
  const filas = registros
    .map(({ numero, cara, estado }) => {
      return `
        <tr>
          <td>${numero}</td>
          <td>${ETIQUETAS_CARA[cara]}</td>
          <td><span class="badge badge-${estado ?? 'sin-registro'}">${estado ? ETIQUETAS_ESTADO[estado] : 'Sin registro'}</span></td>
        </tr>
      `;
    })
    .join('');

  return `
    <section>
      <h3>Odontograma — estado de todas las piezas y caras</h3>
      <p class="nota-fecha">Última actualización: ${textoOGuion(new Date(paciente.odontograma.fecha).toLocaleDateString('es-MX'))}</p>
      <table class="tabla-datos tabla-odontograma">
        <thead>
          <tr><th>Pieza (FDI)</th><th>Cara</th><th>Estado</th></tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
    </section>
  `;
}

function seccionNotasEvolucion(paciente: Paciente): string {
  const notas = [...paciente.historiaClinica.notasEvolucion].sort((a, b) =>
    `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`),
  );

  if (notas.length === 0) {
    return `
      <section>
        <h3>Notas de evolución</h3>
        <p class="sin-datos">No hay notas de evolución registradas.</p>
      </section>
    `;
  }

  const filas = notas
    .map(
      (n: NotaEvolucion) => `
        <div class="nota-evolucion">
          <div class="nota-encabezado">
            <strong>${textoOGuion(n.fecha)} ${textoOGuion(n.hora)}</strong>
            <span class="badge badge-${n.pronostico.toLowerCase()}">${escaparHtml(n.pronostico)}</span>
          </div>
          <p><strong>Región/OD:</strong> ${textoOGuion(n.regionOD)}</p>
          <p><strong>Evolución/procedimiento:</strong> ${textoOGuion(n.evolucionProcedimiento)}</p>
          <p><strong>Dx:</strong> ${textoOGuion(n.dx)} &middot; <strong>Plan:</strong> ${textoOGuion(n.plan)}</p>
          <p><strong>Anestesia:</strong> ${badgeSiNo(n.anestesia)} &middot; <strong>Estudios:</strong> ${listaEstudios(n.estudios)}</p>
          <p><strong>Receta:</strong> ${textoOGuion(n.receta)}</p>
          <p><strong>Indicaciones:</strong> ${textoOGuion(n.indicaciones)}</p>
          <p><strong>Próxima cita:</strong> ${textoOGuion(n.proximaCita)} &middot; <strong>Tratante:</strong> ${textoOGuion(n.tratante)}</p>
        </div>
      `,
    )
    .join('');

  return `
    <section>
      <h3>Notas de evolución</h3>
      ${filas}
    </section>
  `;
}


const ESTILOS_CSS = `
  @page { margin: 24px; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #263238;
    font-size: 12px;
    padding: 0 16px;
  }
  .encabezado-consultorio {
    text-align: center;
    border-bottom: 2px solid #1E88E5;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }
  .encabezado-consultorio h1 {
    font-size: 20px;
    color: #1E88E5;
    margin: 0 0 6px;
  }
  .doctores {
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 4px;
  }
  .fecha-emision {
    font-size: 11px;
    color: #607D8B;
    margin: 0;
  }
  .ficha-paciente {
    background: #F5F7F8;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
  }
  .ficha-paciente h2 {
    margin: 0 0 4px;
    font-size: 16px;
  }
  .ficha-paciente p {
    margin: 2px 0;
    color: #455A64;
  }
  section {
    margin-bottom: 20px;
    page-break-inside: avoid;
  }
  h3 {
    font-size: 14px;
    color: #1E88E5;
    border-bottom: 1px solid #ECEFF1;
    padding-bottom: 4px;
    margin: 16px 0 8px;
  }
  table.tabla-datos {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
  }
  table.tabla-datos td, table.tabla-datos th {
    border: 1px solid #ECEFF1;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  table.tabla-datos td:first-child {
    width: 38%;
    font-weight: 600;
    color: #455A64;
    background: #FAFBFC;
  }
  table.tabla-odontograma th {
    background: #1E88E5;
    color: #fff;
  }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
  }
  .badge-si, .badge-caries { background: #C62828; }
  .badge-no, .badge-favorable { background: #2E7D32; }
  .badge-sana { background: #2E7D32; }
  .badge-sin-registro { background: #78909C; }
  .badge-reservado { background: #EF6C00; }
  .badge-desfavorable { background: #C62828; }
  .badge-obturacion { background: #1E88E5; }
  .nota-evolucion {
    border: 1px solid #ECEFF1;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 10px;
    page-break-inside: avoid;
  }
  .nota-encabezado {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .nota-evolucion p {
    margin: 3px 0;
  }
  .nota-fecha {
    color: #607D8B;
    font-size: 11px;
    margin: 0 0 6px;
  }
  .sin-datos {
    color: #90A4AE;
    font-style: italic;
  }
`;

/** Construye el documento HTML completo del expediente clínico de un paciente. */
export function construirHtmlExpediente(paciente: Paciente): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Expediente clínico - ${escaparHtml(paciente.nombre)}</title>
        <style>${ESTILOS_CSS}</style>
      </head>
      <body>
        ${seccionEncabezadoConsultorio(paciente)}
        ${seccionDatosPersonales(paciente)}
        ${seccionAntecedentesMedicos(paciente)}
        ${seccionAntecedentesGinecoObstetricos(paciente)}
        ${seccionAntecedentesOdontologicos(paciente)}
        ${seccionExploracion(paciente)}
        ${seccionOdontograma(paciente)}
        ${seccionNotasEvolucion(paciente)}
      </body>
    </html>
  `;
}

/**
 * Genera el PDF del expediente clínico completo de un paciente y abre el
 * menú nativo de compartir para enviarlo o guardarlo.
 */
export async function generarYCompartirPdfExpediente(paciente: Paciente): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('Compartir un PDF local no está disponible en la versión web. Usa la aplicación móvil.');
  }

  const html = construirHtmlExpediente(paciente);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const disponible = await Sharing.isAvailableAsync();
  if (!disponible) {
    throw new Error('Compartir archivos no está disponible en este dispositivo.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Expediente clínico - ${paciente.nombre}`,
    UTI: 'com.adobe.pdf',
  });
}
