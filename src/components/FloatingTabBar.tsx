import React from 'react';
import type { RefObject } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LiquidGlassContainer } from './LiquidGlassContainer';

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
    <View style={styles.contenedorPadre}>
      <LiquidGlassContainer height={68}>
        <View style={styles.fondoContenido}>
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
                  activa && styles.pestanaActiva,
                  pressed && styles.presionada,
                ]}
              >
                <Ionicons
                  name={activa ? opcion.iconoActivo : opcion.iconoInactivo}
                  size={20}
                  color={activa ? '#FFFFFF' : '#f3f7fa'}
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
              </Pressable>
            );
          })}
        </View>
      </LiquidGlassContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorPadre: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  fondoContenido: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  pestana: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    gap: 3,
    marginHorizontal: 2,
  },
  pestanaActiva: {
    // Píldora cristalina blanca translúcida en lugar del gris oscuro
    backgroundColor: 'rgba(236, 230, 230, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  etiqueta: {
    color: '#e5eaf0', // Azul helado claro para buena legibilidad
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  etiquetaActiva: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  etiquetaPaciente: {
    fontSize: 9.5,
  },
  presionada: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});