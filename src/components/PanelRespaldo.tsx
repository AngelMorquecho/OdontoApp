import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { DatosConsultorio } from '../context/ConsultorioContext';
import { Paciente } from '../types/paciente';
import { crearRespaldoJson, leerRespaldoJson } from '../utils/respaldoDatos';

interface Props {
  pacientes: Paciente[];
  consultorio: DatosConsultorio;
  onRestaurar: (pacientes: Paciente[], consultorio: DatosConsultorio) => Promise<void>;
  compacto?: boolean;
  deshabilitado?: boolean;
}

export default function PanelRespaldo({
  pacientes,
  consultorio,
  onRestaurar,
  compacto = false,
  deshabilitado = false,
}: Props) {
  const [ocupado, setOcupado] = useState(false);

  const exportar = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'No disponible en web',
        'La exportación de archivos de respaldo está disponible en la aplicación móvil.',
      );
      return;
    }
    setOcupado(true);
    try {
      const contenido = crearRespaldoJson(pacientes, consultorio);
      const nombreArchivo = `odontoapp-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
      const archivo = new File(Paths.cache, nombreArchivo);
      if (archivo.exists) archivo.delete();
      archivo.create();
      archivo.write(contenido);

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Compartir archivos no está disponible en este dispositivo.');
      }
      await Sharing.shareAsync(archivo.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar copia de seguridad',
        UTI: 'public.json',
      });
    } catch (error) {
      Alert.alert(
        'No se pudo exportar el respaldo',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setOcupado(false);
    }
  };

  const importar = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'No disponible en web',
        'La importación de archivos de respaldo está disponible en la aplicación móvil.',
      );
      return;
    }
    try {
      const seleccion = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (seleccion.canceled) return;
      const archivo = seleccion.assets[0];
      if (!archivo.name.toLocaleLowerCase().endsWith('.json')) {
        throw new Error('Selecciona un archivo con extensión .json.');
      }
      const contenido = await new File(archivo.uri).text();
      const respaldo = leerRespaldoJson(contenido);

      Alert.alert(
        'Reemplazar datos actuales',
        `Se importarán ${respaldo.pacientes.length} pacientes y los datos del consultorio. Esta acción reemplazará todos los datos actuales de la aplicación.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Importar respaldo',
            style: 'destructive',
            onPress: () => {
              setOcupado(true);
              void onRestaurar(respaldo.pacientes, respaldo.consultorio)
                .then(() => {
                  Alert.alert('Respaldo importado', 'Se restauraron los datos del consultorio y los pacientes.');
                })
                .catch((error: unknown) => {
                  Alert.alert(
                    'No se pudo importar el respaldo',
                    error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
                  );
                })
                .finally(() => setOcupado(false));
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'No se pudo importar el respaldo',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    }
  };

  return (
    <View style={[styles.panel, compacto && styles.panelCompacto]}>
      {!compacto && (
        <>
          <Text style={styles.titulo}>Respaldo de datos</Text>
          <Text style={styles.descripcion}>
            Guarda o restaura los pacientes y la información del consultorio en un archivo JSON.
          </Text>
        </>
      )}
      <View style={styles.acciones}>
        <Pressable
          accessibilityRole="button"
          disabled={ocupado || deshabilitado}
          onPress={() => void exportar()}
          style={[styles.boton, (ocupado || deshabilitado) && styles.botonOcupado]}
        >
          <Text style={styles.textoBoton}>Exportar JSON</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={ocupado || deshabilitado}
          onPress={() => void importar()}
          style={[
            styles.boton,
            styles.botonImportar,
            (ocupado || deshabilitado) && styles.botonOcupado,
          ]}
        >
          <Text style={[styles.textoBoton, styles.textoImportar]}>Importar JSON</Text>
        </Pressable>
      </View>
      {!compacto && (
        <Text style={styles.nota}>
          La importación reemplaza los datos actuales. Los archivos de imagen vinculados pueden
          requerir volver a adjuntarse al restaurar en otro dispositivo.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#F5F7F8',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  panelCompacto: {
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  titulo: {
    color: '#263238',
    fontSize: 16,
    fontWeight: '700',
  },
  descripcion: {
    color: '#607D8B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 12,
  },
  acciones: {
    flexDirection: 'row',
    gap: 8,
  },
  boton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    paddingHorizontal: 8,
    backgroundColor: '#1565C0',
  },
  botonImportar: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1565C0',
  },
  botonOcupado: {
    opacity: 0.5,
  },
  textoBoton: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  textoImportar: {
    color: '#1565C0',
  },
  nota: {
    color: '#78909C',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
  },
});
