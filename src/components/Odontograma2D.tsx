import React, { useCallback } from "react";
import { ScrollView } from "react-native";
import Svg, { G, Polygon, Rect, Text as SvgText } from "react-native-svg";
import {
  CaraDental,
  EstadoCara,
  INFERIOR,
  NumeroFDI,
  Odontograma,
  SUPERIOR,
} from "./types/odontograma";

// ---------- Configuración visual ----------
const COLORES: Record<EstadoCara, string> = {
  sana: "#FFFFFF",
  caries: "#E53935",
  obturacion: "#1E88E5",
};
const TRAZO = "#37474F";
const TAM = 36; // tamaño de cada diente
const INT = 11; // margen del cuadrado central
const SEP = 8; // separación entre dientes
const PASO = TAM + SEP;
const MARGEN = 12;
const ANCHO = MARGEN * 2 + 16 * PASO - SEP;
const ALTO = 170;
const Y_SUPERIOR = 24;
const Y_INFERIOR = 98;

/** Ciclo al tocar: sana → caries → obturación → sana */
const SIGUIENTE: Record<EstadoCara, EstadoCara> = {
  sana: "caries",
  caries: "obturacion",
  obturacion: "sana",
};

// ---------- Geometría de las 5 caras (en un cuadro de TAM x TAM) ----------
const a = INT;
const b = TAM - INT;
const POLIGONOS = {
  arriba: `0,0 ${TAM},0 ${b},${a} ${a},${a}`,
  abajo: `${a},${b} ${b},${b} ${TAM},${TAM} 0,${TAM}`,
  izquierda: `0,0 ${a},${a} ${a},${b} 0,${TAM}`,
  derecha: `${TAM},0 ${TAM},${TAM} ${b},${b} ${b},${a}`,
};

type Posicion = "arriba" | "abajo" | "izquierda" | "derecha";

/**
 * Mapea cada posición visual a su cara anatómica.
 * - Arcada superior: vestibular arriba. Inferior: vestibular abajo.
 * - Mesial = lado hacia la línea media; distal = lado opuesto.
 *   Cuadrantes 1 y 4 (mitad izquierda de la pantalla): mesial a la derecha.
 *   Cuadrantes 2 y 3 (mitad derecha): mesial a la izquierda.
 */
function mapaCaras(numero: NumeroFDI): Record<Posicion, CaraDental> {
  const cuadrante = Math.floor(numero / 10);
  const superior = cuadrante === 1 || cuadrante === 2;
  const mitadIzquierda = cuadrante === 1 || cuadrante === 4;
  return {
    arriba: superior ? "vestibular" : "lingual",
    abajo: superior ? "lingual" : "vestibular",
    izquierda: mitadIzquierda ? "distal" : "mesial",
    derecha: mitadIzquierda ? "mesial" : "distal",
  };
}

// ---------- Componente ----------
interface Props {
  odontograma: Odontograma;
  onChange: (nuevo: Odontograma) => void;
  /** Si es true, no permite editar. */
  soloLectura?: boolean;
}

export default function Odontograma2D({
  odontograma,
  onChange,
  soloLectura = false,
}: Props) {
  const alTocarCara = useCallback(
    (numero: NumeroFDI, cara: CaraDental) => {
      if (soloLectura) return;
      const diente = odontograma.dientes[numero];
      const nuevoEstado = SIGUIENTE[diente.caras[cara]];
      onChange({
        ...odontograma,
        fecha: new Date().toISOString(),
        dientes: {
          ...odontograma.dientes,
          [numero]: {
            ...diente,
            caras: { ...diente.caras, [cara]: nuevoEstado },
          },
        },
      });
    },
    [odontograma, onChange, soloLectura],
  );

  const renderDiente = (
    numero: NumeroFDI,
    indice: number,
    y: number,
    etiquetaArriba: boolean,
  ) => {
    const x = MARGEN + indice * PASO;
    const caras = odontograma.dientes[numero].caras;
    const mapa = mapaCaras(numero);
    const yEtiqueta = etiquetaArriba ? y - 6 : y + TAM + 14;

    return (
      <G key={numero} x={x} y={y}>
        {(Object.keys(POLIGONOS) as Posicion[]).map((pos) => (
          <Polygon
            key={pos}
            points={POLIGONOS[pos]}
            fill={COLORES[caras[mapa[pos]]]}
            stroke={TRAZO}
            strokeWidth={1}
            onPress={() => alTocarCara(numero, mapa[pos])}
          />
        ))}
        <Rect
          x={a}
          y={a}
          width={b - a}
          height={b - a}
          fill={COLORES[caras.oclusal]}
          stroke={TRAZO}
          strokeWidth={1}
          onPress={() => alTocarCara(numero, "oclusal")}
        />
        {/* Número FDI (coordenadas relativas al grupo) */}
        <SvgText
          x={TAM / 2}
          y={yEtiqueta - y}
          fontSize={11}
          fill={TRAZO}
          textAnchor="middle"
        >
          {numero}
        </SvgText>
      </G>
    );
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <Svg width={ANCHO} height={ALTO} viewBox={`0 0 ${ANCHO} ${ALTO}`}>
        {SUPERIOR.map((n, i) => renderDiente(n, i, Y_SUPERIOR, true))}
        {INFERIOR.map((n, i) => renderDiente(n, i, Y_INFERIOR, false))}
        {/* Línea media */}
        <Rect
          x={MARGEN + 8 * PASO - SEP / 2 - 0.5}
          y={4}
          width={1}
          height={ALTO - 8}
          fill="#B0BEC5"
        />
      </Svg>
    </ScrollView>
  );
}
