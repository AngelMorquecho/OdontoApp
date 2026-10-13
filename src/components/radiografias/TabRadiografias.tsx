import React, { useState } from 'react';
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

interface Props {
  radiografias: Radiografia[];
  onAgregar: (radiografia: Radiografia) => void;
  onAnalizar: () => void;
}

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Pestaña de Radiografías / Galería: visualiza y permite adjuntar fotos y placas. */
export default function TabRadiografias({ radiografias, onAgregar, onAnalizar }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [uriPendiente, setUriPendiente] = useState<string | null>(null);
  const [tipoPendiente, setTipoPendiente] = useState<TipoRadiografia>('foto');
  const [descripcion, setDescripcion] = useState('');

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

  const confirmarAlta = () => {
    if (!uriPendiente) return;
    const nueva: Radiografia = {
      id: `media-${Date.now()}`,
      uri: uriPendiente,
      tipo: tipoPendiente,
      fecha: fechaHoy(),
      descripcion: descripcion.trim(),
    };
    onAgregar(nueva);
    setModalVisible(false);
    setUriPendiente(null);
    setDescripcion('');
  };

  const cancelarAlta = () => {
    setModalVisible(false);
    setUriPendiente(null);
    setDescripcion('');
  };

  return (
    <View style={styles.flex}>
      <View style={styles.barraAcciones}>
        <Pressable style={styles.botonAccion} onPress={tomarFoto}>
          <Text style={styles.botonAccionTexto}>📷 Tomar foto</Text>
        </Pressable>
        <Pressable
          style={[styles.botonAccion, styles.botonAccionSecundario]}
          onPress={elegirDeGaleria}
        >
          <Text style={styles.botonAccionTexto}>🖼️ Elegir de galería</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onAnalizar}
        style={styles.botonAnalizar}
      >
        <Text style={styles.botonAnalizarTexto}>🤖 Analizar con IA</Text>
      </Pressable>

      {radiografias.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioTexto}>
            Aún no hay fotos ni radiografías adjuntas para este paciente.
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...radiografias].reverse()}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.tarjeta}>
              <Image source={{ uri: item.uri }} style={styles.miniatura} />
              <View style={styles.etiquetaTipo}>
                <Text style={styles.etiquetaTipoTexto}>
                  {item.tipo === 'rx' ? 'Rx' : 'Foto'}
                </Text>
              </View>
              <Text style={styles.fechaItem}>{item.fecha}</Text>
              {!!item.descripcion && (
                <Text style={styles.descripcionItem} numberOfLines={2}>
                  {item.descripcion}
                </Text>
              )}
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            {uriPendiente && (
              <Image source={{ uri: uriPendiente }} style={styles.previsualizacion} />
            )}
            <Text style={styles.etiqueta}>Tipo de archivo</Text>
            <View style={styles.filaTipos}>
              {(['foto', 'rx'] as TipoRadiografia[]).map((tipo) => (
                <Pressable
                  key={tipo}
                  style={[
                    styles.chipTipo,
                    tipoPendiente === tipo && styles.chipTipoSeleccionado,
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
                style={[styles.botonModal, styles.botonModalSecundario]}
                onPress={cancelarAlta}
              >
                <Text style={styles.botonModalSecundarioTexto}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.botonModal} onPress={confirmarAlta}>
                <Text style={styles.botonModalTexto}>Guardar</Text>
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
  botonAnalizar: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  botonAnalizarTexto: {
    color: '#0D47A1',
    fontSize: 14,
    fontWeight: '700',
  },
  botonAccion: {
    flex: 1,
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  botonAccionSecundario: {
    backgroundColor: '#455A64',
    marginRight: 0,
  },
  botonAccionTexto: {
    color: '#fff',
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
    color: '#90A4AE',
    fontSize: 15,
  },
  lista: {
    padding: 12,
  },
  tarjeta: {
    flex: 1,
    margin: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    overflow: 'hidden',
    paddingBottom: 8,
  },
  miniatura: {
    width: '100%',
    height: 140,
    backgroundColor: '#ECEFF1',
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
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  fechaItem: {
    fontSize: 12,
    color: '#607D8B',
    marginTop: 6,
    marginHorizontal: 8,
  },
  descripcionItem: {
    fontSize: 12,
    color: '#455A64',
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
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  previsualizacion: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#ECEFF1',
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#455A64',
    marginBottom: 8,
  },
  filaTipos: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chipTipo: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    marginRight: 8,
  },
  chipTipoSeleccionado: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  chipTipoTexto: {
    fontSize: 13,
    color: '#455A64',
    fontWeight: '600',
  },
  chipTipoTextoSeleccionado: {
    color: '#fff',
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#F5F7F8',
    marginBottom: 16,
  },
  filaBotonesModal: {
    flexDirection: 'row',
  },
  botonModal: {
    flex: 1,
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  botonModalSecundario: {
    backgroundColor: '#ECEFF1',
    marginLeft: 0,
  },
  botonModalTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  botonModalSecundarioTexto: {
    color: '#455A64',
    fontSize: 15,
    fontWeight: '700',
  },
});
