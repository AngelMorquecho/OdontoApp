import React, { useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import FloatingTabBar, { FloatingTabRoute } from '../components/FloatingTabBar';
import { borderRadius, colors, shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import {
  CategoriaEducativa,
  TEMAS_EDUCACION_PACIENTE,
  TemaEducativo,
} from '../data/educacionPaciente';

const CATEGORIAS: CategoriaEducativa[] = [
  'Prevención',
  'Tratamientos restauradores',
  'Tratamientos especializados',
  'Encías y periodoncia',
];

const ICONOS_CATEGORIA: Record<CategoriaEducativa | 'Todos', keyof typeof Ionicons.glyphMap> = {
  Todos: 'grid-outline',
  Prevención: 'shield-checkmark-outline',
  'Tratamientos restauradores': 'construct-outline',
  'Tratamientos especializados': 'medical-outline',
  'Encías y periodoncia': 'leaf-outline',
};

type Props = NativeStackScreenProps<RootStackParamList, 'EducacionPaciente'>;

export default function EducacionPacienteScreen({ navigation }: Props) {
  const blurTarget = useRef<View | null>(null);
  const { user } = useAuth();
  const modoPaciente = user?.rol === 'paciente';
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaEducativa | null>(
    null,
  );
  const [temaSeleccionado, setTemaSeleccionado] = useState<TemaEducativo | null>(null);
  const insets = useSafeAreaInsets();

  const temasFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es');
    return TEMAS_EDUCACION_PACIENTE.filter((tema) => {
      const coincideCategoria =
        categoriaSeleccionada === null || tema.categoria === categoriaSeleccionada;
      const contenido = `${tema.titulo} ${tema.categoria} ${tema.descripcionCorta}`.toLocaleLowerCase(
        'es',
      );
      return coincideCategoria && (!termino || contenido.includes(termino));
    });
  }, [busqueda, categoriaSeleccionada]);

  const gruposVisibles = useMemo(
    () =>
      CATEGORIAS.map((categoria) => ({
        categoria,
        temas: temasFiltrados.filter((tema) => tema.categoria === categoria),
      })).filter((grupo) => grupo.temas.length > 0),
    [temasFiltrados],
  );

  const navegar = (ruta: FloatingTabRoute) => {
    if (modoPaciente) {
      if (ruta === 'AgendaCitas') {
        navigation.navigate('PortalPaciente', { seccion: 'citas' });
      } else if (ruta === 'Ajustes') {
        navigation.navigate('Ajustes');
      }
      return;
    }

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

  const renderTema = (tema: TemaEducativo) => (
    <Pressable
      key={tema.id}
      accessibilityRole="button"
      accessibilityLabel={`Ver ${tema.titulo}`}
      onPress={() => setTemaSeleccionado(tema)}
      style={({ pressed }) => [styles.tarjetaTema, pressed && styles.tarjetaPresionada]}
    >
      <View style={styles.miniIlustracion}>
        <SvgXml xml={tema.svgIlustracion} width="100%" height="100%" />
      </View>
      <View style={styles.badgeCategoria}>
        <Text style={styles.categoriaTarjeta} numberOfLines={1}>{tema.categoria}</Text>
      </View>
      <Text style={styles.tituloTarjeta} numberOfLines={2}>{tema.titulo}</Text>
      <Text style={styles.descripcionTarjeta} numberOfLines={3}>
        {tema.descripcionCorta}
      </Text>
      <Text style={styles.enlaceDetalle}>Ver tema ›</Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
    <BlurTargetView
      ref={blurTarget}
      style={[styles.pantalla, { paddingTop: Math.max(insets.top, 12) }]}
    >
      <View style={styles.filtros}>
        <Text style={styles.introduccion}>
          {modoPaciente
            ? 'Guías sencillas para cuidar tu sonrisa, conocer tus tratamientos y resolver dudas sobre higiene bucal.'
            : 'Información clara para conocer los tratamientos y cuidar tu salud bucal.'}
        </Text>

        <TextInput
          accessibilityLabel="Buscar temas educativos"
          style={styles.buscador}
          placeholder="Buscar temas..."
          placeholderTextColor={colors.textSecondary}
          value={busqueda}
          onChangeText={setBusqueda}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listaCategorias}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: categoriaSeleccionada === null }}
            onPress={() => setCategoriaSeleccionada(null)}
            style={({ pressed }) => [
              styles.chipCategoria,
              categoriaSeleccionada === null && styles.chipActivo,
              pressed && styles.chipPresionado,
            ]}
          >
            <Ionicons
              name={ICONOS_CATEGORIA.Todos}
              size={15}
              color={categoriaSeleccionada === null ? colors.surface : colors.textSecondary}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.textoChip,
                categoriaSeleccionada === null && styles.textoChipActivo,
              ]}
            >
              Todos
            </Text>
          </Pressable>
          {CATEGORIAS.map((categoria) => {
            const activo = categoriaSeleccionada === categoria;
            return (
              <Pressable
                key={categoria}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                onPress={() => setCategoriaSeleccionada(activo ? null : categoria)}
                style={({ pressed }) => [
                  styles.chipCategoria,
                  activo && styles.chipActivo,
                  pressed && styles.chipPresionado,
                ]}
              >
                <Ionicons
                  name={ICONOS_CATEGORIA[categoria]}
                  size={15}
                  color={activo ? colors.surface : colors.textSecondary}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.textoChip, activo && styles.textoChipActivo]}
                >
                  {categoria}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        style={styles.listaTemas}
        contentContainerStyle={styles.contenidoLista}
        data={gruposVisibles}
        keyExtractor={(grupo) => grupo.categoria}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.sinResultados}>
            No encontramos temas con esos filtros. Prueba otra búsqueda.
          </Text>
        }
        renderItem={({ item: grupo, index }) => (
          <View style={[styles.grupo, index === 0 && styles.primerGrupo]}>
            <Text style={styles.tituloGrupo}>{grupo.categoria}</Text>
            <View style={styles.gridTemas}>{grupo.temas.map(renderTema)}</View>
          </View>
        )}
      />

      <Modal
        visible={temaSeleccionado !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTemaSeleccionado(null)}
      >
        {temaSeleccionado && (
          <View style={[styles.detallePantalla, { paddingTop: Math.max(insets.top, 12) }]}>
            <View style={styles.barraDetalle}>
              <View style={styles.tituloDetalleContenedor}>
                <Text style={styles.categoriaDetalle}>{temaSeleccionado.categoria}</Text>
                <Text style={styles.tituloDetalle}>{temaSeleccionado.titulo}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar detalle"
                onPress={() => setTemaSeleccionado(null)}
                hitSlop={10}
                style={({ pressed }) => [styles.botonCerrar, pressed && styles.botonPresionado]}
              >
                <Text style={styles.textoCerrar}>Cerrar</Text>
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={[
                styles.contenidoDetalle,
                { paddingBottom: Math.max(insets.bottom, 120) },
              ]}
            >
              <View style={styles.ilustracionDetalle}>
                <SvgXml xml={temaSeleccionado.svgIlustracion} width="100%" height="100%" />
              </View>
              <Text style={styles.tituloSeccion}>¿En qué consiste?</Text>
              <Text style={styles.textoDetalle}>{temaSeleccionado.explicacionDetallada}</Text>

              <Text style={styles.tituloSeccion}>Pasos del tratamiento</Text>
              {temaSeleccionado.pasosTratamiento.map((paso, indice) => (
                <View key={`${temaSeleccionado.id}-paso-${indice}`} style={styles.filaPaso}>
                  <View style={styles.numeroPaso}>
                    <Text style={styles.textoNumeroPaso}>{indice + 1}</Text>
                  </View>
                  <Text style={styles.textoPaso}>{paso}</Text>
                </View>
              ))}

              <Text style={styles.tituloSeccion}>Recomendaciones</Text>
              {temaSeleccionado.recomendacionesPostTratamiento.map((recomendacion, indice) => (
                <View
                  key={`${temaSeleccionado.id}-recomendacion-${indice}`}
                  style={styles.filaRecomendacion}
                >
                  <Text style={styles.vineta}>•</Text>
                  <Text style={styles.textoRecomendacion}>{recomendacion}</Text>
                </View>
              ))}

              <View style={styles.aviso}>
                <Text style={styles.textoAviso}>
                  Este contenido es informativo y no sustituye una valoración ni las indicaciones
                  personalizadas de tu odontólogo.
                </Text>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </BlurTargetView>
    <FloatingTabBar
      rutaActiva="EducacionPaciente"
      onNavegar={navegar}
      blurTarget={blurTarget}
      modoPaciente={modoPaciente}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  introduccion: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filtros: {
    marginBottom: 12,
  },
  buscador: {
    height: 46,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 16,
  },
  listaCategorias: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    gap: 8,
  },
  chipCategoria: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPresionado: {
    opacity: 0.7,
  },
  textoChip: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  textoChipActivo: {
    color: colors.surface,
  },
  listaTemas: {
    flex: 1,
  },
  contenidoLista: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  grupo: {
    marginTop: 16,
  },
  primerGrupo: {
    marginTop: 0,
  },
  tituloGrupo: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  gridTemas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  tarjetaTema: {
    width: '48%',
    flexBasis: '48%',
    minHeight: 215,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: 12,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tarjetaPresionada: {
    opacity: 0.7,
  },
  miniIlustracion: {
    height: 94,
    overflow: 'hidden',
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    marginBottom: 10,
    padding: 4,
  },
  badgeCategoria: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: colors.primaryLight,
    marginBottom: 6,
  },
  categoriaTarjeta: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
    flexShrink: 1,
  },
  tituloTarjeta: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  descripcionTarjeta: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    flex: 1,
  },
  enlaceDetalle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  sinResultados: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 36,
    lineHeight: 22,
  },
  detallePantalla: {
    flex: 1,
    backgroundColor: '#fff',
  },
  barraDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  tituloDetalleContenedor: {
    flex: 1,
    paddingRight: 12,
  },
  categoriaDetalle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  tituloDetalle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '700',
  },
  botonCerrar: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  botonPresionado: {
    opacity: 0.7,
  },
  textoCerrar: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  contenidoDetalle: {
    padding: 18,
  },
  ilustracionDetalle: {
    width: '100%',
    height: 155,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.primaryLight,
    marginBottom: 16,
  },
  tituloSeccion: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  textoDetalle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  filaPaso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  numeroPaso: {
    width: 27,
    height: 27,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    marginRight: 10,
  },
  textoNumeroPaso: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  textoPaso: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    paddingTop: 2,
  },
  filaRecomendacion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
  },
  vineta: {
    color: colors.primary,
    fontSize: 20,
    lineHeight: 22,
    marginRight: 9,
  },
  textoRecomendacion: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  aviso: {
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.md,
    padding: 13,
    marginTop: 18,
  },
  textoAviso: {
    color: '#6D4C41',
    fontSize: 13,
    lineHeight: 19,
  },
});
