import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';
import { DatosConsultorio } from '../context/ConsultorioContext';
import { Medicamento, Receta } from '../types';
import { Paciente } from '../types/paciente';

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fechaLegible(fecha: string): string {
  const [year, month, day] = fecha.split('-').map(Number);
  if (!year || !month || !day) return escaparHtml(fecha);
  return new Date(year, month - 1, day).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function filaMedicamento(medicamento: Medicamento): string {
  return `
    <article class="medicamento">
      <h3>${escaparHtml(medicamento.nombre)}</h3>
      <p><strong>Dosis:</strong> ${escaparHtml(medicamento.dosis)}</p>
      <p><strong>Frecuencia:</strong> ${escaparHtml(medicamento.frecuencia)}</p>
      <p><strong>Duración:</strong> ${escaparHtml(medicamento.duracion)}</p>
      ${medicamento.indicaciones ? `<p><strong>Indicaciones:</strong> ${escaparHtml(medicamento.indicaciones)}</p>` : ''}
    </article>
  `;
}

export function crearHtmlReceta(
  receta: Receta,
  paciente: Paciente,
  consultorio: DatosConsultorio,
): string {
  const medicamentos = receta.medicamentos.length
    ? receta.medicamentos.map(filaMedicamento).join('')
    : '<p>No se indicaron medicamentos.</p>';
  return `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 34px; }
          header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; }
          h1 { color: #0369a1; font-size: 22px; margin: 10px 0 4px; }
          h2 { font-size: 18px; margin-top: 28px; }
          h3 { color: #0369a1; margin: 0 0 8px; }
          p { line-height: 1.45; margin: 5px 0; }
          .clinica { font-size: 17px; font-weight: bold; }
          .muted { color: #475569; font-size: 12px; }
          .ficha, .medicamento, .indicaciones { background: #f8fafc; border-radius: 10px; padding: 14px; margin-top: 12px; }
          .firma { margin-top: 60px; text-align: center; }
          .linea { border-top: 1px solid #64748b; width: 240px; margin: 0 auto 8px; }
        </style>
      </head>
      <body>
        <header>
          ${consultorio.nombreClinica ? `<div class="clinica">${escaparHtml(consultorio.nombreClinica)}</div>` : ''}
          <h1>Receta odontológica</h1>
          <div>${escaparHtml(consultorio.nombreDoctor)}</div>
          ${consultorio.cedula ? `<div class="muted">Cédula profesional: ${escaparHtml(consultorio.cedula)}</div>` : ''}
          ${consultorio.direccion ? `<div class="muted">${escaparHtml(consultorio.direccion)}</div>` : ''}
          ${consultorio.telefono ? `<div class="muted">Tel. ${escaparHtml(consultorio.telefono)}</div>` : ''}
        </header>
        <section class="ficha">
          <p><strong>Paciente:</strong> ${escaparHtml(paciente.nombre)}</p>
          <p><strong>Edad:</strong> ${paciente.edad} años</p>
          <p><strong>Fecha de emisión:</strong> ${fechaLegible(receta.fechaEmision)}</p>
        </section>
        <h2>Diagnóstico</h2>
        <p>${escaparHtml(receta.diagnostico)}</p>
        <h2>Medicamentos</h2>
        ${medicamentos}
        <h2>Cuidados y recomendaciones post-atención</h2>
        <div class="indicaciones">${escaparHtml(receta.indicacionesGenerales).replace(/\n/g, '<br />') || 'Sin indicaciones generales.'}</div>
        <div class="firma">
          <div class="linea"></div>
          <div>${escaparHtml(consultorio.nombreDoctor)}</div>
          <div class="muted">Firma del profesional</div>
        </div>
      </body>
    </html>`;
}

export async function generarPdfReceta(
  receta: Receta,
  paciente: Paciente,
  consultorio: DatosConsultorio,
): Promise<string> {
  const resultado = await Print.printToFileAsync({
    html: crearHtmlReceta(receta, paciente, consultorio),
  });
  return resultado.uri;
}

export async function compartirPdfReceta(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('La función para compartir archivos no está disponible en este dispositivo.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Compartir receta odontológica',
    UTI: 'com.adobe.pdf',
  });
}

export async function generarYCompartirPdfReceta(
  receta: Receta,
  paciente: Paciente,
  consultorio: DatosConsultorio,
): Promise<void> {
  const uri = await generarPdfReceta(receta, paciente, consultorio);
  await compartirPdfReceta(uri);
}

export async function compartirResumenRecetaPorWhatsApp(
  receta: Receta,
  paciente: Paciente,
): Promise<void> {
  const numero = paciente.telefono.replace(/\D/g, '');
  if (!numero) {
    throw new Error('El paciente no tiene un teléfono válido para WhatsApp.');
  }
  const medicamentos = receta.medicamentos.length
    ? receta.medicamentos
        .map((medicamento) =>
          `• ${medicamento.nombre}: ${medicamento.dosis}, ${medicamento.frecuencia}, durante ${medicamento.duracion}.`,
        )
        .join('\n')
    : 'No se indicaron medicamentos.';
  const mensaje = [
    `Receta odontológica para ${paciente.nombre}`,
    `Fecha: ${fechaLegible(receta.fechaEmision)}`,
    `Diagnóstico: ${receta.diagnostico}`,
    medicamentos,
    receta.indicacionesGenerales
      ? `Cuidados y recomendaciones: ${receta.indicacionesGenerales}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  await Linking.openURL(
    `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
  );
}
