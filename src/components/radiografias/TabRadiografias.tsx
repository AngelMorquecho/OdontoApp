import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Radiografia, TipoRadiografia } from '../../types/paciente';
import { borderRadius, colors } from '../../constants/theme';
import { obtenerUrlRadiografia } from '../../services/storageService';

interface Props {
  radiografias: Radiografia[];
  onAgregar: (radiografia: Radiografia) => void;
}

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Componente interno para resolver y renderizar la miniatura con fallback firmado */
function MiniaturaImagen({ item }: { item: Radiografia }) {
  const [uriVisual, setUriVisual] = useState<string>(item.uri);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let activo = true;
    const ruta = item.storagePath || item.uri;

    if (/^https?:\/\//i.test(item.uri)) {
      setUriVisual(item.uri);
      return;
    }

    if (ruta) {
      obtenerUrlRadiografia(ruta)
        .then((signedUrl) => {
          if (activo) setUriVisual(signedUrl);
        })
        .catch(() => {
          if (activo) setFallo(true);
        });
    }

    return () => {
      activo = false;
    };
  }, [item.uri, item.storagePath]);

  if (fallo || !uriVisual) {
    return (
      <View style={[styles.miniatura, styles.miniaturaVacia]}>
        <Text style={styles.textoErrorMiniatura}>📷 Sin vista previa</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: uriVisual }}
      style={styles.miniatura}
      resizeMode="cover"
      onError={() => {
        // Si la Signed URL caducó, regenera una nueva
        const ruta = item.storagePath || item.uri;
        if (ruta && !fallo) {
          obtenerUrlRadiografia(ruta)
            .then(setUriVisual)
            .catch(() => setFallo(true));
        }
      }}
    />
  );
}

export default function TabRadiografias({ radiografias, onAgregar }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [uriPendiente, setUriPendiente] = useState<string | null>(null);
  const [tipoPendiente, setTipoPendiente] = useState<TipoRadiografia>('foto');
  const [descripcion, setDescripcion] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  const tomarFoto = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        'Permiso requerido',
        'Habilita el acceso a la cámara para tomar fotos intraorales.',
      );
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!resultado.canceled && resultado.assets.length > 0) {
      setUriPendiente(resultado.assets[0].uri);
      setTipoPendiente('foto');
      setModalVisible(true);
    }
  };

  const elegirDeGaleria = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        'Permiso requerido',
        'Habilita el acceso a la galería para seleccionar radiografías o fotos.',
      );
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!resultado.canceled && resultado.assets.length > 0) {
      setUriPendiente(resultado.assets[0].uri);
      setTipoPendiente('rx');
      setModalVisible(true);
    }
  };

  const confirmarAlta = async () => {
    if (!uriPendiente) return;
    const nueva: Radiografia = {
      id: `media-${Date.now()}`,
      uri: uriPendiente,
      tipo: tipoPendiente,
      fecha: fechaHoy(),
      descripcion: descripcion.trim(),
    };
    setSubiendo(true);
    try {
      await onAgregar(nueva);
      setModalVisible(false);
      setUriPendiente(null);
      setDescripcion('');
    } catch (error) {
      Alert.alert(
        'No se pudo adjuntar la imagen',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setSubiendo(false);
    }
  };

  const cancelarAlta = () => {
    setModalVisible(false);
    setUriPendiente(null);
    setDescripcion('');
  };

  return (
    <View style={styles.flex}>
      <View style={styles.barraAcciones}>
        <Pressable
          style={({ pressed }) => [styles.botonAccion, pressed && styles.botonPresionado]}
          onPress={tomarFoto}
        >
          <Text style={styles.botonAccionTexto}>📷 Tomar foto</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.botonAccion,
            styles.botonAccionSecundario,
            pressed && styles.botonPresionado,
          ]}
          onPress={elegirDeGaleria}
        >
          <Text style={styles.botonAccionTexto}>🖼️ Elegir de galería</Text>
        </Pressable>
      </View>
      {radiografias.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioTexto}>
            Aún no hay fotos ni radiografías adjuntas para este paciente.
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...radiografias]}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => {
            const esRx =
              item.tipo === 'rx' ||
              item.tipo?.toString().toLowerCase().includes('radiog');

            return (
              <View style={styles.tarjeta}>
                <MiniaturaImagen item={item} />
                <View style={styles.etiquetaTipo}>
                  <Text style={styles.etiquetaTipoTexto}>
                    {esRx ? 'Rx' : 'Foto'}
                  </Text>
                </View>
                <Text style={styles.fechaItem}>{item.fecha}</Text>
                {!!(item.descripcion || item.notas) && (
                  <Text style={styles.descripcionItem} numberOfLines={2}>
                    {item.descripcion || item.notas}
                  </Text>
                )}
              </View>
            );
          }}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            {uriPendiente && (
              <Image
                source={{ uri: uriPendiente }}
                style={styles.previsualizacion}
                resizeMode="cover"
              />
            )}
            <Text style={styles.etiqueta}>Tipo de archivo</Text>
            <View style={styles.filaTipos}>
              {(['foto', 'rx'] as TipoRadiografia[]).map((tipo) => (
                <Pressable
                  key={tipo}
                  style={({ pressed }) => [
                    styles.chipTipo,
                    tipoPendiente === tipo && styles.chipTipoSeleccionado,
                    pressed && styles.botonPresionado,
                  ]}
                  onPress={() => setTipoPendiente(tipo)}
                >
                  <Text
                    style={[
                      styles.chipTipoTexto,
                      tipoPendiente === tipo && styles.chipTipoTextoSeleccionado,
                    ]}
                  >
                    {tipo === 'rx' ? 'Radiografía' : 'Foto intraoral'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.etiqueta}>Descripción (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Rx periapical pieza 36"
              value={descripcion}
              onChangeText={setDescripcion}
            />
            <View style={styles.filaBotonesModal}>
              <Pressable
                style={({ pressed }) => [
                  styles.botonModal,
                  styles.botonModalSecundario,
                  pressed && styles.botonPresionado,
                ]}
                onPress={cancelarAlta}
              >
                <Text style={styles.botonModalSecundarioTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.botonModal,
                  pressed && styles.botonPresionado,
                  subiendo && { opacity: 0.55 },
                ]}
                disabled={subiendo}
                onPress={() => void confirmarAlta()}
              >
                <Text style={styles.botonModalTexto}>
                  {subiendo ? 'Subiendo…' : 'Guardar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  barraAcciones: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
  },
  botonAccion: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  botonAccionSecundario: {
    backgroundColor: colors.secondary,
    marginRight: 0,
  },
  botonPresionado: {
    opacity: 0.7,
  },
  botonAccionTexto: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  vacioTexto: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 15,
  },
  lista: {
    padding: 12,
  },
  tarjeta: {
    flex: 1,
    margin: 4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  miniatura: {
    width: '100%',
    height: 140,
    backgroundColor: colors.border,
  },
  miniaturaVacia: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoErrorMiniatura: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  etiquetaTipo: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(30,136,229,0.9)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  etiquetaTipoTexto: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  fechaItem: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    marginHorizontal: 8,
  },
  descripcionItem: {
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 2,
    marginHorizontal: 8,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContenido: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
  },
  previsualizacion: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.md,
    marginBottom: 12,
    backgroundColor: colors.border,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  filaTipos: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chipTipo: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipTipoSeleccionado: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTipoTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTipoTextoSeleccionado: {
    color: colors.surface,
  },
  input: {
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  filaBotonesModal: {
    flexDirection: 'row',
  },
  botonModal: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  botonModalSecundario: {
    backgroundColor: colors.background,
    marginLeft: 0,
  },
  botonModalTexto: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  botonModalSecundarioTexto: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
});