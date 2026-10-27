import { Image, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import type { AbonoTratamiento, TratamientoPaciente } from '../types';
import type { Paciente } from '../types/paciente';
import type { DatosConsultorio } from '../context/ConsultorioContext';

function moneda(cantidad: number): string {
  return (cantidad ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  });
}

function fechaLegible(fecha?: string): string {
  if (!fecha) return '';
  const [anio, mes, dia] = fecha.split('-').map(Number);
  if (!anio || !mes || !dia) return fecha;
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).toUpperCase();
}

/** Genera la plantilla HTML optimizada incrustando la firma desde Base64 */
function generarHTMLComprobante(
  abono: AbonoTratamiento,
  tratamiento: TratamientoPaciente,
  paciente: Paciente,
  consultorio?: DatosConsultorio,
  firmaBase64?: string,
): string {
  const nombreClinica = consultorio?.nombreClinica || 'MORQUECHO RODRÍGUEZ';
  const subNombre = 'CONSULTORIO DENTAL';
  const nombreDoctor = consultorio?.nombreDoctor || 'Dr. Luis Morquecho García';
  const cedula = consultorio?.cedula ? `Céd. Prof. ${consultorio.cedula}` : 'Céd. Prof. 13912006';
  const direccion = consultorio?.direccion || 'Pico de Orizaba 400B, Jardines del Sur, Aguascalientes, Ags.';

  const abonosOrdenados = (tratamiento.abonos || []).slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
  const abonosAnteriores = abonosOrdenados.filter(item => item.id !== abono.id && item.fecha <= abono.fecha);

  const totalPagadoHastaHoy = abonosOrdenados
    .filter(item => item.fecha <= abono.fecha)
    .reduce((sum, item) => sum + item.monto, 0);
  
  const saldoRestante = Math.max(0, tratamiento.costoTotal - totalPagadoHastaHoy);

  const logoSVG = `
    <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 15C20 15 15 25 15 40C15 60 25 85 35 85C42 85 45 75 50 75C55 75 58 85 65 85C75 85 85 60 85 40C85 25 80 15 70 15C60 15 55 22 50 22C45 22 40 15 30 15Z" stroke="#B8975B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M35 35C40 30 45 35 50 40C55 35 60 30 65 35" stroke="#B8975B" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `;

  let seccionAbonosHTML = '';

  if (abonosAnteriores.length > 0) {
    seccionAbonosHTML = `
      <div class="section-title">HISTORIAL DE ABONOS ANTERIORES</div>
      <table class="abonos-table">
        <thead>
          <tr>
            <th style="width: 30%;">FECHA</th>
            <th style="width: 45%;">FORMA DE PAGO</th>
            <th class="text-right" style="width: 25%;">IMPORTE</th>
          </tr>
        </thead>
        <tbody>
          ${abonosAnteriores.map(item => `
            <tr>
              <td>${fechaLegible(item.fecha)}</td>
              <td>${(item.metodoPago || 'Efectivo').toUpperCase()}</td>
              <td class="text-right font-bold">${moneda(item.monto)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    seccionAbonosHTML = `
      <div class="section-title">CONTROL DE ABONOS POSTERIORES</div>
      <table class="abonos-table">
        <thead>
          <tr>
            <th style="width: 30%;">FECHA</th>
            <th style="width: 45%;">FORMA DE PAGO</th>
            <th class="text-right" style="width: 25%;">IMPORTE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
          <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  // Se inyecta directamente el formato data URI completo
  const imagenFirmaHTML = firmaBase64
    ? `<img src="data:image/png;base64,${firmaBase64}" alt="Firma Doctor" class="img-firma" />`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Plan de Tratamiento - ${paciente.nombre}</title>
      <style>
        @page {
          size: letter portrait;
          margin: 0;
        }
        html, body {
          height: 100%;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden;
          background-color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #222222;
          -webkit-print-color-adjust: exact;
        }
        * {
          box-sizing: border-box;
        }
        .page-wrapper {
          width: 100%;
          height: 100vh;
          padding: 30px 40px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        .watermark {
          position: absolute;
          top: 38%;
          left: 5%;
          width: 90%;
          text-align: center;
          font-size: 38px;
          font-weight: 900;
          color: rgba(184, 151, 91, 0.07);
          transform: rotate(-30deg);
          letter-spacing: 4px;
          pointer-events: none;
          text-transform: uppercase;
          z-index: 0;
        }
        .container {
          max-width: 680px;
          margin: 0 auto;
          width: 100%;
          position: relative;
          z-index: 1;
        }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; }
        .logo-box {
          width: 68px; height: 68px; background-color: #f7f5f0;
          display: flex; align-items: center; justify-content: center; border-radius: 4px;
        }
        .header-text h1 { margin: 0; font-size: 20px; font-weight: 800; color: #1a1a1a; letter-spacing: 0.5px; }
        .header-text .sub { margin: 2px 0 0 0; font-size: 12px; font-weight: 600; color: #B8975B; letter-spacing: 0.5px; }
        .header-text .doc { margin: 3px 0 0 0; font-size: 11px; color: #777777; }
        .divider-gold { border-top: 1.5px solid #D4AF37; margin-bottom: 16px; }
        .title-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px; }
        .title-row h2 { margin: 0; font-size: 19px; font-weight: 800; color: #1a1a1a; letter-spacing: 0.5px; }
        .title-row .subtitle { font-size: 12px; font-weight: 700; color: #B8975B; margin-top: 2px; letter-spacing: 0.5px; }
        .title-row .date { font-size: 11px; font-weight: 700; color: #555555; }
        .patient-card { background-color: #fbf9f5; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
        .patient-card .label { font-size: 9px; font-weight: 800; color: #B8975B; letter-spacing: 1px; margin-bottom: 2px; }
        .patient-card .name { font-size: 15px; font-weight: 800; color: #1a1a1a; }
        .section-title { font-size: 11px; font-weight: 800; color: #1a1a1a; letter-spacing: 0.5px; margin-bottom: 8px; text-transform: UPPERCASE; }
        table.detail-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.detail-table th { background-color: #222222; color: #ffffff; font-size: 10px; font-weight: 700; padding: 8px 10px; text-align: left; letter-spacing: 0.5px; }
        table.detail-table td { padding: 10px; font-size: 12px; color: #333333; border-bottom: 1px solid #eeeeee; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .financial-box { margin-bottom: 16px; }
        .financial-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; color: #333333; }
        .saldo-box {
          background-color: #fbf9f5; border-radius: 6px; padding: 10px 14px;
          display: flex; justify-content: space-between; align-items: center; margin-top: 6px;
        }
        .saldo-box .label { font-size: 12px; font-weight: 800; color: #1a1a1a; letter-spacing: 0.5px; }
        .saldo-box .amount { font-size: 16px; font-weight: 800; color: #B8975B; }
        table.abonos-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.abonos-table th { font-size: 9px; font-weight: 700; color: #777777; border-bottom: 1px solid #cccccc; padding: 4px 0; text-align: left; }
        table.abonos-table td { padding: 8px 0; border-bottom: 1px solid #eeeeee; font-size: 11px; }
        .legal-notes { font-size: 10px; color: #666666; line-height: 1.4; margin-top: 10px; margin-bottom: 20px; }
        .signatures-row { display: flex; justify-content: flex-end; margin-bottom: 16px; }
        .signature-col { width: 42%; text-align: center; }
        .line { border-top: 1px solid #666666; margin-bottom: 6px; }
        .sig-title { font-size: 11px; font-weight: 800; color: #1a1a1a; }
        .sig-sub { font-size: 10px; color: #777777; margin-top: 1px; }
        .footer-line { border-top: 1.5px solid #D4AF37; padding-top: 6px; text-align: left; font-size: 9px; color: #777777; }
        .img-firma {
          height: 55px;
          max-width: 160px;
          object-fit: contain;
          margin-bottom: -10px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
      </style>
    </head>
    <body>
      <div class="page-wrapper">
        <div class="watermark">COMPROBANTE OFICIAL · ${nombreClinica}</div>
        <div class="container">
          <div class="header">
            <div class="logo-box">${logoSVG}</div>
            <div class="header-text">
              <h1>${nombreClinica}</h1>
              <div class="sub">${subNombre}</div>
              <div class="doc">${nombreDoctor} | ${cedula}</div>
            </div>
          </div>
          <div class="divider-gold"></div>
          <div class="title-row">
            <div>
              <h2>PLAN DE TRATAMIENTO</h2>
              <div class="subtitle">Y CONTROL DE PAGOS</div>
            </div>
            <div class="date">${fechaLegible(abono.fecha)}</div>
          </div>
          <div class="patient-card">
            <div class="label">PACIENTE</div>
            <div class="name">${paciente.nombre}</div>
          </div>
          <div class="section-title">DETALLE DEL TRATAMIENTO</div>
          <table class="detail-table">
            <thead>
              <tr>
                <th style="width: 55%;">CONCEPTO</th>
                <th class="text-center" style="width: 15%;">UNIDADES</th>
                <th class="text-right" style="width: 15%;">UNITARIO</th>
                <th class="text-right" style="width: 15%;">IMPORTE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${tratamiento.nombre}${tratamiento.descripcion ? ` - ${tratamiento.descripcion}` : ''}</td>
                <td class="text-center">1</td>
                <td class="text-right">${moneda(tratamiento.costoTotal)}</td>
                <td class="text-right font-bold">${moneda(tratamiento.costoTotal)}</td>
              </tr>
            </tbody>
          </table>
          <div class="section-title">RESUMEN FINANCIERO</div>
          <div class="financial-box">
            <div class="financial-row">
              <span>Importe total del tratamiento</span>
              <span class="font-bold">${moneda(tratamiento.costoTotal)}</span>
            </div>
            <div class="financial-row">
              <span>Abono recibido · ${fechaLegible(abono.fecha)}</span>
              <span class="font-bold">${moneda(abono.monto)}</span>
            </div>
            <div class="saldo-box">
              <span class="label">SALDO PENDIENTE</span>
              <span class="amount">${moneda(saldoRestante)}</span>
            </div>
          </div>
          ${seccionAbonosHTML}
          <div class="legal-notes">
            El abono recibido se aplica al costo total del tratamiento.<br/>
            Los pagos posteriores se registrarán al momento de su recepción.
          </div>
          <div class="signatures-row">
            <div class="signature-col">
              ${imagenFirmaHTML}
              <div class="line"></div>
              <div class="sig-title">Firma del odontólogo</div>
              <div class="sig-sub">${nombreDoctor}</div>
            </div>
          </div>
        </div>
        <div class="footer-line">${direccion}</div>
      </div>
    </body>
    </html>
  `;
}

function mostrarPanelOpcionesWeb(html: string, nombrePaciente: string) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background-color: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 99999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: #ffffff; width: 90%; max-width: 420px;
    border-radius: 16px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    text-align: center;
  `;

  const iconoImpresoraSVG = `<svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor"><path d="M400 96H112a32 32 0 00-32 32v64h352v-64a32 32 0 00-32-32zM384 320a16 16 0 1116-16 16 16 0 01-16 16z"/><path d="M384 224H128a64 64 0 00-64 64v128h96v-48a32 32 0 0132-32h128a32 32 0 0132 32v48h96V288a64 64 0 00-64-64zm-32 192H160v-64h192z"/></svg>`;
  const iconoCompartirSVG = `<svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor"><path d="M384 336a63.78 63.78 0 00-46.12 19.7l-148-83.27a63.85 63.85 0 000-32.86l148-83.27A63.8 63.8 0 10320 112a63.49 63.49 0 002.12 16.43l-148 83.27a64 64 0 100 88.6l148 83.27A63.8 63.8 0 10384 336z"/></svg>`;

  modal.innerHTML = `
    <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 18px; font-weight: 700;">Comprobante de Abono</h3>
    <p style="margin: 0 0 20px 0; color: #64748b; font-size: 13px;">Selecciona la acción para el recibo de <b>${nombrePaciente}</b></p>
    
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <button id="btn-print" style="
        background: #0284c7; color: white; border: none; padding: 12px; border-radius: 10px;
        font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
      ">
        ${iconoImpresoraSVG} Imprimir / Guardar como PDF
      </button>

      <button id="btn-share" style="
        background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; padding: 12px; border-radius: 10px;
        font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
      ">
        ${iconoCompartirSVG} Compartir recibo
      </button>

      <button id="btn-close" style="
        background: transparent; color: #64748b; border: none; padding: 10px; margin-top: 4px;
        font-weight: 600; font-size: 13px; cursor: pointer;
      ">Cancelar</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('btn-print')?.addEventListener('click', () => {
    document.body.removeChild(overlay);
    const v = window.open('', '_blank', 'width=800,height=900');
    if (v) {
      v.document.write(html);
      v.document.close();
      v.focus();
      setTimeout(() => {
        v.print();
        v.close();
      }, 300);
    }
  });

  document.getElementById('btn-share')?.addEventListener('click', async () => {
    document.body.removeChild(overlay);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Comprobante de Pago - ${nombrePaciente}`,
          text: `Adjunto el recibo de abono dental de ${nombrePaciente}`,
        });
      } catch {
        // Cancelado por el usuario
      }
    } else {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Recibo_${nombrePaciente.replace(/\s+/g, '_')}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  });

  document.getElementById('btn-close')?.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}

export async function imprimirComprobanteAbono(
  abono: AbonoTratamiento,
  tratamiento: TratamientoPaciente,
  paciente: Paciente,
  consultorio?: DatosConsultorio,
): Promise<void> {
  let firmaBase64: string | undefined;

  try {
    // 1. Carga el módulo de la firma desde assets
    const asset = Asset.fromModule(require('../../assets/firma.png'));
    await asset.downloadAsync();
    const uriLocal = asset.localUri || asset.uri;

    // 2. Lee la imagen en formato Base64 para incrustarla en el HTML
    if (uriLocal) {
      firmaBase64 = await FileSystem.readAsStringAsync(uriLocal, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
  } catch (err) {
    console.warn('No se pudo cargar la firma como Base64:', err);
  }

  const html = generarHTMLComprobante(abono, tratamiento, paciente, consultorio, firmaBase64);

  if (Platform.OS === 'web') {
    mostrarPanelOpcionesWeb(html, paciente.nombre);
    return;
  }

  // 1. Genera archivo PDF temporal
  const { uri: tempUri } = await Print.printToFileAsync({ html, width: 612, height: 792 });

  // 2. Formateo y sanitización del nombre del paciente
  const nombreLimpio = paciente.nombre
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita acentos y tildes
    .replace(/[^a-zA-Z0-9_\s-]/g, '') // Elimina caracteres especiales
    .replace(/\s+/g, '_'); // Sustituye espacios por guiones bajos

  // 3. Estructura solicitada: Abono_[Cantidad]_[Fecha]_[NombrePaciente].pdf
  const fechaPago = abono.fecha || new Date().toISOString().split('T')[0];
  const nombreArchivo = `Abono_${abono.monto}_${fechaPago}_${nombreLimpio}.pdf`;

  // Se obtiene la ruta del directorio de forma compatible sin errores de tipos de TypeScript
  const baseDir = (FileSystem as any).documentDirectory || tempUri.substring(0, tempUri.lastIndexOf('/') + 1);
  const targetUri = `${baseDir}${nombreArchivo}`;

  // 4. Renombra el archivo en el sistema de archivos
  await FileSystem.moveAsync({
    from: tempUri,
    to: targetUri,
  });

  // 5. Presenta el menú nativo de compartir con el nuevo nombre
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(targetUri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Compartir Comprobante ${nombreArchivo}`,
    });
  } else {
    await Print.printAsync({ html });
  }
}