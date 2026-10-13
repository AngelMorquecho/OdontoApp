import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { DatosConsultorio } from '../context/ConsultorioContext';
import { Paciente } from '../types/paciente';
import { crearRespaldoJson, leerRespaldoJson } from '../utils/respaldoDatos';
import { borderRadius, colors } from '../constants/theme';

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
          style={({ pressed }) => [
            styles.boton,
            compacto && styles.botonCompacto,
            (ocupado || deshabilitado) && styles.botonOcupado,
            pressed && styles.botonPresionado,
          ]}
        >
          <Ionicons
            name="cloud-download-outline"
            size={18}
            color={compacto ? colors.primary : colors.surface}
          />
          <Text style={[styles.textoBoton, compacto && styles.textoBotonCompacto]}>
            Exportar JSON
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={ocupado || deshabilitado}
          onPress={() => void importar()}
          style={({ pressed }) => [
            styles.boton,
            styles.botonImportar,
            compacto && styles.botonCompacto,
            (ocupado || deshabilitado) && styles.botonOcupado,
            pressed && styles.botonPresionado,
          ]}
        >
          <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
          <Text style={[styles.textoBoton, styles.textoImportar, compacto && styles.textoBotonCompacto]}>
            Importar JSON
          </Text>
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
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelCompacto: {
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  descripcion: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 12,
  },
  acciones: {
    flexDirection: 'row',
    gap: 10,
  },
  boton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    backgroundColor: colors.primary,
  },
  botonCompacto: {
    minHeight: 40,
    paddingHorizontal: 8,
    borderRadius: borderRadius.full,
  },
  botonImportar: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  botonPresionado: {
    opacity: 0.7,
  },
  botonOcupado: {
    opacity: 0.5,
  },
  textoBoton: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },
  textoBotonCompacto: {
    color: colors.primary,
    fontSize: 11,
  },
  textoImportar: {
    color: colors.primary,
  },
  nota: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
  },
});
