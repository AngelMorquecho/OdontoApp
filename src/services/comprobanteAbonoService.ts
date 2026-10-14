import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { DatosConsultorio } from '../context/ConsultorioContext';
import type { AbonoTratamiento, TratamientoPaciente } from '../types';
import type { Paciente } from '../types/paciente';

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fechaLegible(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  if (!anio || !mes || !dia) return escaparHtml(fecha);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function moneda(cantidad: number): string {
  return cantidad.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
}

export function crearHtmlComprobanteAbono(
  abono: AbonoTratamiento,
  tratamiento: TratamientoPaciente,
  paciente: Paciente,
  consultorio: DatosConsultorio,
): string {
  const totalPagado = tratamiento.abonos.reduce((total, pago) => total + pago.monto, 0);
  const saldo = Math.max(0, tratamiento.costoTotal - totalPagado);
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: Arial, sans-serif; color: #0f172a; margin: 36px; }
      header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; }
      h1 { color: #0369a1; font-size: 23px; margin: 8px 0; }
      h2 { font-size: 17px; margin: 24px 0 8px; }
      p { line-height: 1.5; margin: 7px 0; }
      .muted { color: #475569; font-size: 12px; }
      .folio { color: #0369a1; font-size: 12px; font-weight: bold; }
      .card { background: #f8fafc; border-radius: 10px; padding: 16px; margin-top: 18px; }
      .monto { color: #15803d; font-size: 28px; font-weight: bold; }
      .saldo { border-top: 1px solid #cbd5e1; padding-top: 10px; margin-top: 12px; }
      footer { margin-top: 36px; text-align: center; }
    </style>
  </head>
  <body>
    <header>
      ${consultorio.nombreClinica ? `<div><strong>${escaparHtml(consultorio.nombreClinica)}</strong></div>` : ''}
      <h1>Comprobante de abono</h1>
      <div>${escaparHtml(consultorio.nombreDoctor)}</div>
      ${consultorio.cedula ? `<div class="muted">Cédula profesional: ${escaparHtml(consultorio.cedula)}</div>` : ''}
      ${consultorio.direccion ? `<div class="muted">${escaparHtml(consultorio.direccion)}</div>` : ''}
      ${consultorio.telefono ? `<div class="muted">Tel. ${escaparHtml(consultorio.telefono)}</div>` : ''}
    </header>
    <p class="folio">Folio: ${escaparHtml(abono.id)}</p>
    <section class="card">
      <p><strong>Paciente:</strong> ${escaparHtml(paciente.nombre)}</p>
      <p><strong>Tratamiento:</strong> ${escaparHtml(tratamiento.nombre)}</p>
      <p><strong>Fecha de pago:</strong> ${fechaLegible(abono.fecha)}</p>
      <p><strong>Método:</strong> ${escaparHtml(abono.metodoPago)}</p>
      ${abono.concepto ? `<p><strong>Concepto:</strong> ${escaparHtml(abono.concepto)}</p>` : ''}
    </section>
    <section class="card">
      <div class="monto">${moneda(abono.monto)}</div>
      <p><strong>Costo total:</strong> ${moneda(tratamiento.costoTotal)}</p>
      <p><strong>Total pagado:</strong> ${moneda(totalPagado)}</p>
      <p class="saldo"><strong>Saldo pendiente:</strong> ${moneda(saldo)}</p>
    </section>
    <footer class="muted">Comprobante generado por OdontoApp.</footer>
  </body>
</html>`;
}

export async function imprimirComprobanteAbono(
  abono: AbonoTratamiento,
  tratamiento: TratamientoPaciente,
  paciente: Paciente,
  consultorio: DatosConsultorio,
): Promise<void> {
  const html = crearHtmlComprobanteAbono(abono, tratamiento, paciente, consultorio);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const archivo = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('No se puede compartir el comprobante en este dispositivo.');
  }
  await Sharing.shareAsync(archivo.uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Compartir comprobante de abono',
    UTI: 'com.adobe.pdf',
  });
}
