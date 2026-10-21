import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { obtenerAsistentesPorDoctor } from '../services/asistentes';

export default function ListaAsistentesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [asistentes, setAsistentes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargarAsistentes = async () => {
    if (!user?.id) return;
    try {
      const data = await obtenerAsistentesPorDoctor(user.id);
      setAsistentes(data || []);
    } catch (error: any) {
      console.error('Error al cargar asistentes:', error.message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarAsistentes();
    }, [user?.id])
  );

  const onRefresh = () => {
    setRefrescando(true);
    cargarAsistentes();
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cardItem}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={22} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Asistente</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tituloHeader}>Asistentes registradas</Text>
        <Pressable
          style={({ pressed }) => [
            styles.btnNuevo,
            pressed && styles.presionado,
          ]}
          onPress={() => navigation.navigate('CrearAsistente')}
        >
          <Ionicons name="add" size={20} color={colors.surface} />
          <Text style={styles.btnNuevoText}>Nueva</Text>
        </Pressable>
      </View>

      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={asistentes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerEmpty}>
              <Ionicons
                name="people-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>No hay asistentes registradas</Text>
              <Text style={styles.emptySub}>
                Presiona el botón "Nueva" para agregar la primera asistente.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  tituloHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  btnNuevo: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    gap: 4,
    ...shadows.sm,
  },
  btnNuevoText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  cardItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    ...shadows.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  nombre: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerEmpty: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  presionado: {
    opacity: 0.8,
  },
});