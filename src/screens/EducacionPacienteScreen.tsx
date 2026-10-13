import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
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

export default function EducacionPacienteScreen() {
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
    <View style={[styles.pantalla, { paddingTop: Math.max(insets.top, 12) }]}>
      <Text style={styles.introduccion}>
        Información clara para conocer los tratamientos y cuidar tu salud bucal.
      </Text>

      <TextInput
        accessibilityLabel="Buscar temas educativos"
        style={styles.buscador}
        placeholder="Buscar temas..."
        placeholderTextColor="#78909C"
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
            color={categoriaSeleccionada === null ? '#fff' : '#475569'}
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
                color={activo ? '#fff' : '#475569'}
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
        renderItem={({ item: grupo }) => (
          <View style={styles.grupo}>
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
                { paddingBottom: Math.max(insets.bottom, 24) },
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
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  introduccion: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  buscador: {
    height: 46,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    color: '#0F172A',
    fontSize: 16,
  },
  listaCategorias: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  chipCategoria: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  chipActivo: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  chipPresionado: {
    opacity: 0.7,
  },
  textoChip: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  textoChipActivo: {
    color: '#fff',
  },
  listaTemas: {
    flex: 1,
  },
  contenidoLista: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  grupo: {
    marginTop: 18,
  },
  tituloGrupo: {
    color: '#0F172A',
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
    minHeight: 215,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#fff',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  tarjetaPresionada: {
    opacity: 0.7,
  },
  miniIlustracion: {
    height: 94,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
    padding: 4,
  },
  badgeCategoria: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: '#E0F2FE',
    marginBottom: 6,
  },
  categoriaTarjeta: {
    color: '#0369A1',
    fontSize: 9,
    fontWeight: '700',
    flexShrink: 1,
  },
  tituloTarjeta: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  descripcionTarjeta: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    flex: 1,
  },
  enlaceDetalle: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  sinResultados: {
    color: '#64748B',
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
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  tituloDetalleContenedor: {
    flex: 1,
    paddingRight: 12,
  },
  categoriaDetalle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  tituloDetalle: {
    color: '#0F172A',
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
    color: '#0284C7',
    fontSize: 14,
    fontWeight: '700',
  },
  contenidoDetalle: {
    padding: 18,
  },
  ilustracionDetalle: {
    width: '100%',
    height: 155,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F2F8FE',
    marginBottom: 16,
  },
  tituloSeccion: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  textoDetalle: {
    color: '#475569',
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
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    marginRight: 10,
  },
  textoNumeroPaso: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
  },
  textoPaso: {
    flex: 1,
    color: '#475569',
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
    color: '#1E88E5',
    fontSize: 20,
    lineHeight: 22,
    marginRight: 9,
  },
  textoRecomendacion: {
    flex: 1,
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
  },
  aviso: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 13,
    marginTop: 18,
  },
  textoAviso: {
    color: '#6D4C41',
    fontSize: 13,
    lineHeight: 19,
  },
});
