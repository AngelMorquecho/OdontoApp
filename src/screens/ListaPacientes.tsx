import React, { useLayoutEffect, useMemo, useState } from 'react';
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
        <Pressable onPress={confirmarRestablecer} hitSlop={8}>
          <Text style={styles.botonRestablecer}>Restablecer</Text>
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
          style={({ pressed }) => [
            styles.botonAcceso,
            pressed && styles.botonEducacionPresionado,
          ]}
        >
          <Text style={styles.iconoEducacion}>📚</Text>
          <Text style={styles.tituloAcceso}>Educación</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Ajustes')}
          style={({ pressed }) => [
            styles.botonAcceso,
            pressed && styles.botonEducacionPresionado,
          ]}
        >
          <Text style={styles.iconoEducacion}>⚙️</Text>
          <Text style={styles.tituloAcceso}>Ajustes</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Ajustes', { seccion: 'respaldo' })}
          style={({ pressed }) => [
            styles.botonAcceso,
            pressed && styles.botonEducacionPresionado,
          ]}
        >
          <Text style={styles.iconoEducacion}>💾</Text>
          <Text style={styles.tituloAcceso}>Respaldo</Text>
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
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>
                {item.nombre.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.infoPaciente}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.detalle}>
                {item.edad} años · {item.telefono}
              </Text>
              <Text style={styles.motivo} numberOfLines={1}>
                {item.motivoConsulta}
              </Text>
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
        <Text style={styles.botonFlotanteTexto}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#fff',
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#F5F7F8',
  },
  accesosRapidos: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  botonAcceso: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 62,
    paddingHorizontal: 5,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  botonEducacionPresionado: {
    backgroundColor: '#D5EAFB',
  },
  iconoEducacion: {
    fontSize: 19,
  },
  tituloAcceso: {
    color: '#0D47A1',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
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
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tarjetaPresionada: {
    backgroundColor: '#ECEFF1',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexto: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  infoPaciente: {
    flex: 1,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#263238',
  },
  detalle: {
    fontSize: 13,
    color: '#607D8B',
    marginTop: 2,
  },
  motivo: {
    fontSize: 13,
    color: '#455A64',
    marginTop: 4,
    fontStyle: 'italic',
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
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  botonFlotantePresionado: {
    backgroundColor: '#1669AC',
  },
  botonFlotanteTexto: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '600',
  },
  botonRestablecer: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
});
