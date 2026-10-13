import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  CARAS,
  CaraDental,
  EstadoCara,
  TODOS_LOS_DIENTES,
} from '../components/types/odontograma';
import { usePacientes } from '../context/PacientesContext';
import {
  HallazgoIa,
  analizarImagenDental,
  ResultadoDiagnosticoIa,
} from '../services/aiDiagnosis';
import { NotaEvolucion, Radiografia } from '../types/paciente';

type Props = NativeStackScreenProps<RootStackParamList, 'DiagnosticoIa'>;

const ETIQUETAS_TIPO: Record<HallazgoIa['tipo'], string> = {
  caries: 'Caries',
  restauracion: 'Restauración',
  periodontal: 'Periodontal',
};

const ESTADO_POR_TIPO: Partial<Record<HallazgoIa['tipo'], EstadoCara>> = {
  caries: 'caries',
  restauracion: 'obturacion',
};

const ETIQUETAS_CARA: Record<CaraDental, string> = {
  vestibular: 'Vestibular',
  lingual: 'Lingual/palatina',
  mesial: 'Mesial',
  distal: 'Distal',
  oclusal: 'Oclusal/incisal',
};

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function horaAhora(): string {
  return new Date().toTimeString().slice(0, 5);
}

function crearUriId(): string {
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function DiagnosticoIaScreen({ route, navigation }: Props) {
  const { pacienteId } = route.params;
  const {
    obtenerPaciente,
    agregarRadiografia,
    actualizarOdontograma,
    agregarNotaEvolucion,
  } = usePacientes();
  const paciente = obtenerPaciente(pacienteId);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<Radiografia | null>(null);
  const [resultado, setResultado] = useState<ResultadoDiagnosticoIa | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [hallazgosConfirmados, setHallazgosConfirmados] = useState<number[]>([]);
  const [carasElegidas, setCarasElegidas] = useState<Record<number, CaraDental>>({});

  const imagenesPaciente = useMemo(() => paciente?.radiografias ?? [], [paciente?.radiografias]);

  if (!paciente) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.textoVacio}>No se encontró información del paciente.</Text>
      </View>
    );
  }

  const seleccionarImagen = (imagen: Radiografia) => {
    setImagenSeleccionada(imagen);
    setResultado(null);
    setHallazgosConfirmados([]);
    setCarasElegidas({});
  };

  const elegirImagenGaleria = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          'Permiso requerido',
          'Habilita el acceso a la galería para elegir una radiografía o foto intraoral.',
        );
        return;
      }
      const seleccion = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (seleccion.canceled || seleccion.assets.length === 0) return;

      const asset = seleccion.assets[0];
      const nuevaImagen: Radiografia = {
        id: crearUriId(),
        uri: asset.uri,
        tipo: 'foto',
        fecha: fechaHoy(),
        descripcion: 'Imagen agregada para análisis asistido',
      };
      agregarRadiografia(pacienteId, nuevaImagen);
      seleccionarImagen(nuevaImagen);
    } catch (error) {
      Alert.alert(
        'No se pudo abrir la galería',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    }
  };

  const tomarImagen = async () => {
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso requerido', 'Habilita el acceso a la cámara para tomar una foto.');
        return;
      }
      const captura = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (captura.canceled || captura.assets.length === 0) return;

      const nuevaImagen: Radiografia = {
        id: crearUriId(),
        uri: captura.assets[0].uri,
        tipo: 'foto',
        fecha: fechaHoy(),
        descripcion: 'Foto intraoral agregada para análisis asistido',
      };
      agregarRadiografia(pacienteId, nuevaImagen);
      seleccionarImagen(nuevaImagen);
    } catch (error) {
      Alert.alert(
        'No se pudo abrir la cámara',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    }
  };

  const analizar = async () => {
    if (!imagenSeleccionada) {
      Alert.alert('Selecciona una imagen', 'Elige una imagen del paciente o toma una nueva.');
      return;
    }
    setAnalizando(true);
    setResultado(null);
    setHallazgosConfirmados([]);
    try {
      const respuesta = await analizarImagenDental(imagenSeleccionada.uri);
      setResultado(respuesta);
    } catch (error) {
      Alert.alert(
        'No se pudo analizar la imagen',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setAnalizando(false);
    }
  };

  const alternarConfirmacion = (indice: number) => {
    setHallazgosConfirmados((anteriores) =>
      anteriores.includes(indice)
        ? anteriores.filter((actual) => actual !== indice)
        : [...anteriores, indice],
    );
  };

  const elegirCara = (indice: number, cara: CaraDental) => {
    setCarasElegidas((anteriores) => ({ ...anteriores, [indice]: cara }));
  };

  const aplicarHallazgos = (aplicarOdontograma: boolean) => {
    if (!resultado || !imagenSeleccionada) return;
    const confirmados = resultado.hallazgos.flatMap((hallazgo, indice) =>
      hallazgosConfirmados.includes(indice) ? [{ hallazgo, indice }] : [],
    );
    if (confirmados.length === 0) {
      Alert.alert('Confirma al menos un hallazgo', 'Selecciona los hallazgos revisados por el doctor.');
      return;
    }

    const dentalesSinCara = confirmados.some(
      ({ hallazgo, indice }) =>
        aplicarOdontograma && ESTADO_POR_TIPO[hallazgo.tipo] && !carasElegidas[indice],
    );
    if (dentalesSinCara) {
      Alert.alert(
        'Selecciona las caras dentales',
        'Indica qué cara de cada diente se actualizará en el odontograma.',
      );
      return;
    }

    const dienteInvalido = confirmados.find(
      ({ hallazgo }) =>
        !TODOS_LOS_DIENTES.includes(
          Number(hallazgo.dienteFDI) as (typeof TODOS_LOS_DIENTES)[number],
        ),
    );
    if (dienteInvalido) {
      Alert.alert(
        'Hallazgo inválido',
        `El diente FDI "${dienteInvalido.hallazgo.dienteFDI}" no pertenece a la dentición permanente registrada.`,
      );
      return;
    }

    Alert.alert(
      'Confirmar registro clínico',
      'El análisis es una simulación de demostración, no interpretó la imagen y puede ser incorrecto. ¿Confirmas que revisaste estos hallazgos y quieres guardarlos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: aplicarOdontograma ? 'Guardar confirmados' : 'Crear nota',
          onPress: () => {
            if (aplicarOdontograma) {
              const odontograma = {
                ...paciente.odontograma,
                fecha: new Date().toISOString(),
                dientes: { ...paciente.odontograma.dientes },
              };
              confirmados.forEach(({ hallazgo, indice }) => {
                const estado = ESTADO_POR_TIPO[hallazgo.tipo];
                const numero = Number(hallazgo.dienteFDI);
                if (!estado) return;
                const cara = carasElegidas[indice];
                const diente = odontograma.dientes[numero as (typeof TODOS_LOS_DIENTES)[number]];
                odontograma.dientes[numero as (typeof TODOS_LOS_DIENTES)[number]] = {
                  ...diente,
                  caras: { ...diente.caras, [cara]: estado },
                };
              });
              actualizarOdontograma(pacienteId, odontograma);
            }

            const textoHallazgos = confirmados
              .map(({ hallazgo }) =>
                  `${ETIQUETAS_TIPO[hallazgo.tipo]} en diente ${hallazgo.dienteFDI} (${(
                    hallazgo.confianza * 100
                  ).toFixed(0)}%): ${hallazgo.descripcion}`,
              )
              .join('\n');
            const nota: NotaEvolucion = {
              id: `nota-${Date.now()}`,
              fecha: fechaHoy(),
              hora: horaAhora(),
              regionOD: [
                ...new Set(confirmados.map(({ hallazgo }) => hallazgo.dienteFDI)),
              ].join(', '),
              evolucionProcedimiento: `Hallazgos de demostración revisados por el doctor a partir de la imagen "${imagenSeleccionada.descripcion || imagenSeleccionada.tipo}".\n${textoHallazgos}`,
              dx: 'Registro de demostración asistido por IA; no representa interpretación de imagen.',
              pronostico: 'Reservado',
              plan: resultado.sugerenciaTratamiento,
              anestesia: 'no',
              estudios: {
                rx: imagenSeleccionada.tipo === 'rx',
                fotos: imagenSeleccionada.tipo === 'foto',
                escaneo: false,
                cbct: false,
              },
              receta: '',
              indicaciones:
                'Verificar los hallazgos mediante exploración clínica. Resultado de simulación; no usar como diagnóstico.',
              proximaCita: '',
              tratante: '',
            };
            agregarNotaEvolucion(pacienteId, nota);
            Alert.alert(
              'Hallazgos guardados',
              aplicarOdontograma
                ? 'Los hallazgos confirmados se registraron en el odontograma y en una nota marcada como simulación.'
                : 'Se creó una nota de evolución marcada como simulación.',
              [{ text: 'Aceptar', onPress: () => navigation.goBack() }],
            );
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.pantalla} contentContainerStyle={styles.contenido}>
      <View style={styles.avisoDemo}>
        <Text style={styles.tituloAviso}>⚠️ Demostración, no diagnóstico clínico</Text>
        <Text style={styles.textoAviso}>
          Este prototipo no analiza los píxeles de la imagen. Los resultados son ejemplos ficticios
          para probar el flujo y no deben utilizarse para atención clínica.
        </Text>
      </View>

      <Text style={styles.tituloSeccion}>1. Elige una imagen de {paciente.nombre}</Text>
      <View style={styles.filaAcciones}>
        <Pressable style={styles.botonSecundario} onPress={() => void elegirImagenGaleria()}>
          <Text style={styles.textoBotonSecundario}>🖼️ Galería</Text>
        </Pressable>
        <Pressable style={styles.botonSecundario} onPress={() => void tomarImagen()}>
          <Text style={styles.textoBotonSecundario}>📷 Tomar foto</Text>
        </Pressable>
      </View>

      {imagenesPaciente.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listaImagenes}
        >
          {imagenesPaciente.map((imagen) => {
            const seleccionada = imagenSeleccionada?.id === imagen.id;
            return (
              <Pressable
                key={imagen.id}
                accessibilityRole="button"
                accessibilityState={{ selected: seleccionada }}
                onPress={() => seleccionarImagen(imagen)}
                style={[styles.tarjetaImagen, seleccionada && styles.tarjetaImagenSeleccionada]}
              >
                <Image source={{ uri: imagen.uri }} style={styles.miniatura} />
                <Text style={styles.etiquetaImagen}>
                  {imagen.tipo === 'rx' ? 'Radiografía' : 'Foto'} · {imagen.fecha}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.textoVacio}>Este paciente aún no tiene imágenes guardadas.</Text>
      )}

      {imagenSeleccionada && (
        <View style={styles.vistaImagen}>
          <Image
            source={{ uri: imagenSeleccionada.uri }}
            style={styles.imagenCompleta}
            resizeMode="contain"
          />
          {resultado && <OverlayHallazgos hallazgos={resultado.hallazgos} />}
          {!!resultado && <Text style={styles.etiquetaOverlay}>Marcas de ejemplo</Text>}
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        disabled={!imagenSeleccionada || analizando}
        onPress={() => void analizar()}
        style={[
          styles.botonPrincipal,
          (!imagenSeleccionada || analizando) && styles.botonDeshabilitado,
        ]}
      >
        {analizando ? (
          <View style={styles.filaCarga}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.textoBotonPrincipal}>Escaneando imagen…</Text>
          </View>
        ) : (
          <Text style={styles.textoBotonPrincipal}>🤖 Analizar con IA</Text>
        )}
      </Pressable>

      {resultado && (
        <View style={styles.seccionResultado}>
          <Text style={styles.tituloSeccion}>2. Revisa y confirma los ejemplos</Text>
          <Text style={styles.resumen}>{resultado.resumenGeneral}</Text>
          {resultado.hallazgos.map((hallazgo, indice) => {
            const confirmado = hallazgosConfirmados.includes(indice);
            const estado = ESTADO_POR_TIPO[hallazgo.tipo];
            return (
              <View key={`${hallazgo.tipo}-${hallazgo.dienteFDI}-${indice}`} style={styles.tarjetaHallazgo}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: confirmado }}
                  onPress={() => alternarConfirmacion(indice)}
                  style={styles.filaHallazgo}
                >
                  <View style={[styles.checkbox, confirmado && styles.checkboxActivo]}>
                    {confirmado && <Text style={styles.check}>✓</Text>}
                  </View>
                  <View style={styles.infoHallazgo}>
                    <Text style={styles.tituloHallazgo}>
                      {ETIQUETAS_TIPO[hallazgo.tipo]} · Diente {hallazgo.dienteFDI}
                    </Text>
                    <Text style={styles.descripcionHallazgo}>{hallazgo.descripcion}</Text>
                    <Text style={styles.confianza}>
                      Confianza simulada: {(hallazgo.confianza * 100).toFixed(0)}%
                    </Text>
                  </View>
                </Pressable>

                {confirmado && estado && (
                  <View style={styles.selectorCaras}>
                    <Text style={styles.etiquetaCara}>Cara a actualizar:</Text>
                    <View style={styles.filaCaras}>
                      {CARAS.map((cara) => {
                        const activa = carasElegidas[indice] === cara;
                        return (
                          <Pressable
                            key={cara}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: activa }}
                            onPress={() => elegirCara(indice, cara)}
                            style={[styles.chipCara, activa && styles.chipCaraActivo]}
                          >
                            <Text style={[styles.textoCara, activa && styles.textoCaraActivo]}>
                              {ETIQUETAS_CARA[cara]}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={styles.ayudaCara}>
                      Se guardará como {estado === 'caries' ? 'caries' : 'obturación'} en esa cara.
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          <Text style={styles.sugerencia}>
            <Text style={styles.negrita}>Sugerencia de demostración: </Text>
            {resultado.sugerenciaTratamiento}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => aplicarHallazgos(true)}
            style={styles.botonAplicar}
          >
            <Text style={styles.textoBotonAplicar}>Aplicar al Odontograma / Expediente</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => aplicarHallazgos(false)}
            style={styles.botonNota}
          >
            <Text style={styles.textoBotonNota}>Solo crear nota de evolución</Text>
          </Pressable>
          <Text style={styles.notaRegistro}>
            Solo se guardarán los hallazgos que confirmes. Los resultados quedan identificados
            como simulación.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function OverlayHallazgos({ hallazgos }: { hallazgos: HallazgoIa[] }) {
  const visibles = hallazgos.slice(0, 4);
  const posiciones = [
    { x: 22, y: 30 },
    { x: 72, y: 36 },
    { x: 46, y: 70 },
    { x: 82, y: 68 },
  ];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {visibles.map((hallazgo, indice) => {
          const posicion = posiciones[indice];
          return (
            <React.Fragment key={`${hallazgo.dienteFDI}-${indice}`}>
              <Circle
                cx={posicion.x}
                cy={posicion.y}
                r="7"
                fill="rgba(229,57,53,0.18)"
                stroke="#C62828"
                strokeWidth="0.8"
              />
              <Circle cx={posicion.x} cy={posicion.y} r="1.3" fill="#C62828" />
              <Line
                x1={posicion.x + 5}
                y1={posicion.y - 5}
                x2={posicion.x + 13}
                y2={posicion.y - 12}
                stroke="#C62828"
                strokeWidth="0.8"
              />
              <SvgText
                x={posicion.x + 13}
                y={posicion.y - 13}
                fill="#fff"
                stroke="#7F0000"
                strokeWidth="0.3"
                fontSize="4"
                fontWeight="bold"
              >
                {hallazgo.dienteFDI} · {(hallazgo.confianza * 100).toFixed(0)}%
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contenido: {
    padding: 16,
    paddingBottom: 32,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  avisoDemo: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFCC80',
    marginBottom: 18,
  },
  tituloAviso: {
    color: '#8D4D00',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 5,
  },
  textoAviso: {
    color: '#6D4C41',
    fontSize: 13,
    lineHeight: 19,
  },
  tituloSeccion: {
    color: '#263238',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  filaAcciones: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  botonSecundario: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    backgroundColor: '#F2F8FE',
  },
  textoBotonSecundario: {
    color: '#1565C0',
    fontWeight: '700',
    fontSize: 13,
  },
  listaImagenes: {
    gap: 10,
    paddingBottom: 10,
  },
  tarjetaImagen: {
    width: 116,
    padding: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CFD8DC',
  },
  tarjetaImagenSeleccionada: {
    borderColor: '#1E88E5',
    borderWidth: 2,
    backgroundColor: '#E3F2FD',
  },
  miniatura: {
    width: '100%',
    height: 76,
    borderRadius: 7,
    backgroundColor: '#ECEFF1',
  },
  etiquetaImagen: {
    color: '#455A64',
    fontSize: 10,
    marginTop: 4,
  },
  textoVacio: {
    color: '#78909C',
    lineHeight: 20,
    marginBottom: 12,
  },
  vistaImagen: {
    width: '100%',
    height: 260,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#17212B',
    marginTop: 6,
    marginBottom: 14,
  },
  imagenCompleta: {
    width: '100%',
    height: '100%',
  },
  etiquetaOverlay: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    color: '#fff',
    backgroundColor: 'rgba(38,50,56,0.82)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    overflow: 'hidden',
  },
  botonPrincipal: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#1565C0',
    marginTop: 4,
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  filaCarga: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textoBotonPrincipal: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  seccionResultado: {
    marginTop: 22,
  },
  resumen: {
    color: '#546E7A',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  tarjetaHallazgo: {
    borderWidth: 1,
    borderColor: '#E4EAEE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 9,
    backgroundColor: '#fff',
  },
  filaHallazgo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#90A4AE',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActivo: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  check: {
    color: '#fff',
    fontWeight: '700',
  },
  infoHallazgo: {
    flex: 1,
  },
  tituloHallazgo: {
    color: '#263238',
    fontSize: 14,
    fontWeight: '700',
  },
  descripcionHallazgo: {
    color: '#546E7A',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  confianza: {
    color: '#1565C0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },
  selectorCaras: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ECEFF1',
  },
  etiquetaCara: {
    color: '#455A64',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
  },
  filaCaras: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipCara: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  chipCaraActivo: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  textoCara: {
    color: '#546E7A',
    fontSize: 11,
  },
  textoCaraActivo: {
    color: '#0D47A1',
    fontWeight: '700',
  },
  ayudaCara: {
    color: '#78909C',
    fontSize: 11,
    marginTop: 6,
  },
  sugerencia: {
    color: '#455A64',
    fontSize: 13,
    lineHeight: 19,
    backgroundColor: '#F5F7F8',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
  },
  negrita: {
    fontWeight: '700',
  },
  botonAplicar: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    marginTop: 8,
  },
  textoBotonAplicar: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  botonNota: {
    alignItems: 'center',
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E88E5',
    marginTop: 9,
  },
  textoBotonNota: {
    color: '#1565C0',
    fontSize: 14,
    fontWeight: '700',
  },
  notaRegistro: {
    color: '#78909C',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 9,
  },
});
