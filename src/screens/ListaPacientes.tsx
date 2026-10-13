import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
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
import FloatingTabBar, { FloatingTabRoute } from '../components/FloatingTabBar';
import { borderRadius, colors, shadows } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ListaPacientes'>;

export default function ListaPacientes({ navigation }: Props) {
  const blurTarget = useRef<View | null>(null);
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const navegar = (ruta: FloatingTabRoute) => {
    switch (ruta) {
      case 'ListaPacientes':
        navigation.navigate('ListaPacientes');
        break;
      case 'AgendaCitas':
        navigation.navigate('AgendaCitas');
        break;
      case 'EducacionPaciente':
        navigation.navigate('EducacionPaciente');
        break;
      case 'Ajustes':
        navigation.navigate('Ajustes');
        break;
    }
  };

  return (
    <View style={styles.pantalla}>
      <BlurTargetView ref={blurTarget} style={styles.contenedor}>
      <TextInput
        style={styles.buscador}
        placeholder="Buscar paciente por nombre..."
        placeholderTextColor={colors.textSecondary}
        value={busqueda}
        onChangeText={setBusqueda}
        autoCapitalize="words"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      <View style={styles.accesosRapidos}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('AgendarCita', undefined)}
          style={({ pressed }) => [styles.botonAcceso, pressed && styles.botonAccesoPresionado]}
        >
          <Ionicons name="calendar-outline" size={23} color={colors.primary} />
          <Text numberOfLines={1} style={styles.tituloAcceso}>Agendar cita</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('EducacionPaciente')}
          style={({ pressed }) => [styles.botonAcceso, pressed && styles.botonAccesoPresionado]}
        >
          <Ionicons name="book-outline" size={23} color={colors.primary} />
          <Text numberOfLines={1} style={styles.tituloAcceso}>Educación</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Ajustes')}
          style={({ pressed }) => [styles.botonAcceso, pressed && styles.botonAccesoPresionado]}
        >
          <Ionicons name="settings-outline" size={23} color={colors.primary} />
          <Text numberOfLines={1} style={styles.tituloAcceso}>Ajustes</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Ajustes', { seccion: 'respaldo' })}
          style={({ pressed }) => [styles.botonAcceso, pressed && styles.botonAccesoPresionado]}
        >
          <Ionicons name="cloud-download-outline" size={23} color={colors.primary} />
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
            android_ripple={{ color: colors.border }}
          >
            <View style={styles.avatar}>
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
        <Ionicons name="add" size={29} color={colors.surface} />
      </Pressable>
      </BlurTargetView>
      <FloatingTabBar
        rutaActiva="ListaPacientes"
        onNavegar={navegar}
        blurTarget={blurTarget}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  buscador: {
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
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
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  botonAccesoPresionado: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  tituloAcceso: {
    color: colors.textPrimary,
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
    paddingBottom: 100,
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  tarjetaPresionada: {
    opacity: 0.7,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexto: {
    color: colors.primary,
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
    color: colors.textPrimary,
    flex: 1,
    flexShrink: 1,
  },
  detalle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    flexShrink: 1,
  },
  badgeEdad: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  textoEdad: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  cajaMotivo: {
    alignSelf: 'stretch',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 7,
  },
  motivo: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  sinResultados: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 40,
    fontSize: 15,
  },
  botonFlotante: {
    position: 'absolute',
    right: 20,
    bottom: 104,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
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
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
});
