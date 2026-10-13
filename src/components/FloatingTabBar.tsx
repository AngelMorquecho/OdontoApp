import React from 'react';
import { BlurView } from 'expo-blur';
import type { RefObject } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors } from '../constants/theme';

export type FloatingTabRoute =
  | 'ListaPacientes'
  | 'AgendaCitas'
  | 'EducacionPaciente'
  | 'Ajustes';

interface TabOption {
  ruta: FloatingTabRoute;
  etiqueta: string;
  iconoActivo: keyof typeof Ionicons.glyphMap;
  iconoInactivo: keyof typeof Ionicons.glyphMap;
}

interface Props {
  rutaActiva: FloatingTabRoute;
  onNavegar: (ruta: FloatingTabRoute) => void;
  blurTarget?: RefObject<View | null>;
  modoPaciente?: boolean;
}

const OPCIONES: TabOption[] = [
  {
    ruta: 'ListaPacientes',
    etiqueta: 'Pacientes',
    iconoActivo: 'people',
    iconoInactivo: 'people-outline',
  },
  {
    ruta: 'AgendaCitas',
    etiqueta: 'Agenda',
    iconoActivo: 'calendar',
    iconoInactivo: 'calendar-outline',
  },
  {
    ruta: 'EducacionPaciente',
    etiqueta: 'Educación',
    iconoActivo: 'book',
    iconoInactivo: 'book-outline',
  },
  {
    ruta: 'Ajustes',
    etiqueta: 'Ajustes',
    iconoActivo: 'settings',
    iconoInactivo: 'settings-outline',
  },
];

export default function FloatingTabBar({
  rutaActiva,
  onNavegar,
  blurTarget,
  modoPaciente = false,
}: Props) {
  const opciones = modoPaciente
    ? [
        {
          ruta: 'AgendaCitas' as const,
          etiqueta: 'Mis Citas',
          iconoActivo: 'calendar' as const,
          iconoInactivo: 'calendar-outline' as const,
        },
        {
          ruta: 'EducacionPaciente' as const,
          etiqueta: 'Educación',
          iconoActivo: 'book' as const,
          iconoInactivo: 'book-outline' as const,
        },
        {
          ruta: 'Ajustes' as const,
          etiqueta: 'Mi Perfil',
          iconoActivo: 'person-circle' as const,
          iconoInactivo: 'person-circle-outline' as const,
        },
      ]
    : OPCIONES;
  return (
    <BlurView
      blurTarget={blurTarget}
      blurMethod="dimezisBlurViewSdk31Plus"
      intensity={65}
      tint="light"
      style={styles.barra}
    >
      <View style={styles.fondoCristal}>
        {opciones.map((opcion) => {
          const activa = opcion.ruta === rutaActiva;
          return (
            <Pressable
              key={opcion.ruta}
              accessibilityRole="button"
              accessibilityLabel={opcion.etiqueta}
              accessibilityState={{ selected: activa }}
              onPress={() => onNavegar(opcion.ruta)}
              style={({ pressed }) => [
                styles.pestana,
                pressed && styles.presionada,
              ]}
            >
              <Ionicons
                name={activa ? opcion.iconoActivo : opcion.iconoInactivo}
                size={22}
                color={activa ? colors.primary : colors.textSecondary}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.etiqueta,
                  modoPaciente && styles.etiquetaPaciente,
                  activa && styles.etiquetaActiva,
                ]}
              >
                {opcion.etiqueta}
              </Text>
              <View style={[styles.indicador, activa && styles.indicadorActivo]} />
            </Pressable>
          );
        })}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  barra: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 68,
    overflow: 'hidden',
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fondoCristal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  pestana: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  etiqueta: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 1,
  },
  etiquetaActiva: {
    color: colors.primary,
    fontWeight: '700',
  },
  etiquetaPaciente: {
    fontSize: 8,
  },
  indicador: {
    width: 4,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
  },
  indicadorActivo: {
    width: 14,
    backgroundColor: colors.primary,
  },
  presionada: {
    opacity: 0.65,
  },
});
