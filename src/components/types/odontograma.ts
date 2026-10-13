/** Las 5 caras de una pieza dental. */
export type CaraDental =
  | 'vestibular'
  | 'lingual' // palatina en el maxilar superior
  | 'mesial'
  | 'distal'
  | 'oclusal'; // incisal en dientes anteriores

export const CARAS: readonly CaraDental[] = [
  'vestibular',
  'lingual',
  'mesial',
  'distal',
  'oclusal',
] as const;

/** Estado clínico de una cara. */
export type EstadoCara = 'sana' | 'caries' | 'obturacion';

/** Numeración FDI (dentición permanente, 32 piezas). */
export type NumeroFDI =
  | 18 | 17 | 16 | 15 | 14 | 13 | 12 | 11
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28
  | 48 | 47 | 46 | 45 | 44 | 43 | 42 | 41
  | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38;

export const SUPERIOR: readonly NumeroFDI[] = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
];
export const INFERIOR: readonly NumeroFDI[] = [
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];
export const TODOS_LOS_DIENTES: readonly NumeroFDI[] = [...SUPERIOR, ...INFERIOR];

export interface Diente {
  numero: NumeroFDI;
  caras: Record<CaraDental, EstadoCara>;
}

export interface Odontograma {
  pacienteId: string;
  /** Fecha ISO 8601 de la última modificación. */
  fecha: string;
  dientes: Record<NumeroFDI, Diente>;
}

/** Crea un odontograma con las 32 piezas y todas las caras sanas. */
export function crearOdontogramaVacio(pacienteId: string): Odontograma {
  const dientes = {} as Record<NumeroFDI, Diente>;
  for (const numero of TODOS_LOS_DIENTES) {
    dientes[numero] = {
      numero,
      caras: {
        vestibular: 'sana',
        lingual: 'sana',
        mesial: 'sana',
        distal: 'sana',
        oclusal: 'sana',
      },
    };
  }
  return { pacienteId, fecha: new Date().toISOString(), dientes };
}
