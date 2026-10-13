export type TipoHallazgoIa = 'caries' | 'restauracion' | 'periodontal';

export interface HallazgoIa {
  tipo: TipoHallazgoIa;
  dienteFDI: string;
  confianza: number;
  descripcion: string;
}

export interface ResultadoDiagnosticoIa {
  hallazgos: HallazgoIa[];
  resumenGeneral: string;
  sugerenciaTratamiento: string;
  simulacion: true;
}

/**
 * Resultado de demostración para construir y probar el flujo de revisión.
 * No analiza los píxeles ni debe utilizarse para tomar decisiones clínicas.
 */
export async function analizarImagenDental(uriImagen: string): Promise<ResultadoDiagnosticoIa> {
  if (!uriImagen.trim()) {
    throw new Error('Selecciona una imagen antes de iniciar el análisis.');
  }

  await new Promise<void>((resolve) => setTimeout(resolve, 1200));

  return {
    simulacion: true,
    resumenGeneral:
      'Resultado de demostración: se muestran hallazgos de ejemplo para probar la revisión. La imagen no fue interpretada por un modelo de IA.',
    sugerenciaTratamiento:
      'Como ejemplo de flujo, revisar clínicamente los dientes señalados y definir si se requiere exploración, radiografías complementarias o tratamiento. Esta sugerencia no es una indicación clínica.',
    hallazgos: [
      {
        tipo: 'caries',
        dienteFDI: '16',
        confianza: 0.84,
        descripcion: 'Hallazgo de caries de ejemplo para probar la confirmación.',
      },
      {
        tipo: 'restauracion',
        dienteFDI: '26',
        confianza: 0.91,
        descripcion: 'Hallazgo de restauración de ejemplo para probar la confirmación.',
      },
      {
        tipo: 'periodontal',
        dienteFDI: '36',
        confianza: 0.72,
        descripcion: 'Hallazgo periodontal de ejemplo para probar la confirmación.',
      },
    ],
  };
}
