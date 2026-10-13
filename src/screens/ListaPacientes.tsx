import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Paciente } from '../types/paciente';
import { usePacientes } from '../context/PacientesContext';
import { useConsultorio } from '../context/ConsultorioContext';
import PanelRespaldo from '../components/PanelRespaldo';

type Props = NativeStackScreenProps<RootStackParamList, 'ListaPacientes'>;

export default function ListaPacientes({ navigation }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const {
    pacientes,
    cargando,
    limpiarAlmacenamiento,
    reemplazarPacientes,
  } = usePacientes();
  const { consultorio, cargandoConsultorio, restaurarConsultorio } = useConsultorio();

  const confirmarRestablecer = () => {
    Alert.alert(
      'Restablecer datos',
      'Esto borrará todos los pacientes guardados en este dispositivo y restaurará los datos de ejemplo. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () => limpiarAlmacenamiento(),
        },
      ],
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={confirmarRestablecer}
          hitSlop={8}
          style={({ pressed }) => [styles.botonRestablecer, pressed && styles.botonAccesoPresionado]}
        >
          <Text style={styles.textoRestablecer}>Restablecer</Text>
        </Pressable>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const pacientesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return pacientes;
    return pacientes.filter((p) => p.nombre.toLowerCase().includes(termino));
  }, [busqueda, pacientes]);

  const irADetalle = (paciente: Paciente) => {
    navigation.navigate('DetallePaciente', { pacienteId: paciente.id });
  };

  const irAAgregar = () => {
    navigation.navigate('AgregarPaciente');
  };

  const coloresAvatar = ['#0284C7', '#059669', '#7C3AED', '#DB2777', '#D97706'];
  const obtenerColorAvatar = (nombre: string) => {
    const indice = [...nombre].reduce((total, caracter) => total + caracter.charCodeAt(0), 0);
    return coloresAvatar[indice % coloresAvatar.length];
  };
  const obtenerIniciales = (nombre: string) =>
    nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toLocaleUpperCase('es'))
      .join('');

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <TextInput
        style={styles.buscador}
        placeholder="Buscar paciente por nombre..."
        placeholderTextColor="#90A4AE"
        value={busqueda}
        onChangeText={setBusqueda}
        autoCapitalize="words"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      <View style={styles.accesosRapidos}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('EducacionPaciente')}
          style={({ pressed }) => [styles.botonAcceso, pressed && styles.botonAccesoPresionado]}
        >
          <Ionicons name="book-outline" size={23} color="#0284C7" />
          <Text numberOfLines={1} style={styles.tituloAcceso}>Educación</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Ajustes')}
          style={({ pressed }) => [styles.botonAcceso, pressed && styles.botonAccesoPresionado]}
        >
          <Ionicons name="settings-outline" size={23} color="#0284C7" />
          <Text numberOfLines={1} style={styles.tituloAcceso}>Ajustes</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Ajustes', { seccion: 'respaldo' })}
          style={({ pressed }) => [styles.botonAcceso, pressed && styles.botonAccesoPresionado]}
        >
          <Ionicons name="cloud-download-outline" size={23} color="#0284C7" />
          <Text numberOfLines={1} style={styles.tituloAcceso}>Respaldo</Text>
        </Pressable>
      </View>

      <View style={styles.panelRespaldo}>
        <PanelRespaldo
          compacto
          deshabilitado={cargandoConsultorio}
          pacientes={pacientes}
          consultorio={consultorio}
          onRestaurar={async (pacientesImportados, consultorioImportado) => {
            try {
              await restaurarConsultorio(consultorioImportado);
              await reemplazarPacientes(pacientesImportados);
            } catch (error) {
              await Promise.all([
                restaurarConsultorio(consultorio),
                reemplazarPacientes(pacientes),
              ]);
              throw error;
            }
          }}
        />
      </View>

      <FlatList
        data={pacientesFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <Text style={styles.sinResultados}>
            No se encontraron pacientes con ese nombre.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => irADetalle(item)}
            style={({ pressed }) => [
              styles.tarjeta,
              pressed && styles.tarjetaPresionada,
            ]}
            android_ripple={{ color: '#CFD8DC' }}
          >
            <View style={[styles.avatar, { backgroundColor: obtenerColorAvatar(item.nombre) }]}>
              <Text numberOfLines={1} style={styles.avatarTexto}>
                {obtenerIniciales(item.nombre)}
              </Text>
            </View>
            <View style={styles.infoPaciente}>
              <View style={styles.filaNombre}>
                <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
                <View style={styles.badgeEdad}>
                  <Text style={styles.textoEdad} numberOfLines={1}>{item.edad} años</Text>
                </View>
              </View>
              <Text style={styles.detalle} numberOfLines={1}>{item.telefono}</Text>
              <View style={styles.cajaMotivo}>
                <Text style={styles.motivo} numberOfLines={2}>{item.motivoConsulta}</Text>
              </View>
            </View>
          </Pressable>
        )}
      />

      <Pressable
        style={({ pressed }) => [
          styles.botonFlotante,
          pressed && styles.botonFlotantePresionado,
        ]}
        onPress={irAAgregar}
        accessibilityRole="button"
        accessibilityLabel="Agregar nuevo paciente"
      >
        <Ionicons name="add" size={29} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  buscador: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  accesosRapidos: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  botonAcceso: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 6,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  botonAccesoPresionado: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  tituloAcceso: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
    maxWidth: '100%',
  },
  panelRespaldo: {
    marginBottom: 8,
  },
  lista: {
    paddingBottom: 24,
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  tarjetaPresionada: {
    opacity: 0.7,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexto: {
    color: '#0284C7',
    fontSize: 15,
    fontWeight: '700',
  },
  infoPaciente: {
    flex: 1,
    minWidth: 0,
  },
  filaNombre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    flexShrink: 1,
  },
  detalle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    flexShrink: 1,
  },
  badgeEdad: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  textoEdad: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
  },
  cajaMotivo: {
    alignSelf: 'stretch',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 7,
  },
  motivo: {
    fontSize: 12,
    lineHeight: 16,
    color: '#475569',
    flexShrink: 1,
  },
  sinResultados: {
    textAlign: 'center',
    color: '#90A4AE',
    marginTop: 40,
    fontSize: 15,
  },
  botonFlotante: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  botonFlotantePresionado: {
    opacity: 0.7,
  },
  botonRestablecer: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginRight: 4,
  },
  textoRestablecer: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
});
