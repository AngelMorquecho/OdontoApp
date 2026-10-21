import React, { useRef, useState } from 'react';
import { BlurTargetView } from 'expo-blur';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import FloatingTabBar, { type FloatingTabRoute } from '../components/FloatingTabBar';
import { borderRadius, colors, shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useConsultorio, type DatosConsultorio } from '../context/ConsultorioContext';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Ajustes'>;

export default function AjustesScreen({ navigation }: Props) {
  const blurTarget = useRef<View | null>(null);
  const { user, logout } = useAuth();
  const {
    consultorio,
    cargandoConsultorio,
    actualizarConsultorio,
  } = useConsultorio();

  if (!user) return null;

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
    <View style={styles.root}>
      <BlurTargetView ref={blurTarget} style={styles.destinoBlur}>
        <ScrollView
          style={styles.pantalla}
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.seccion}>
            <Text style={styles.titulo}>Mi perfil</Text>
            <Text style={styles.nombre}>{user.nombre}</Text>
            <Text style={styles.secundario}>{user.email}</Text>
            <Text style={styles.etiquetaRol}>
              {user.rol === 'DOCTOR' ? 'Cuenta de doctor' : 'Portal de paciente'}
            </Text>
          </View>

          {user.rol === 'DOCTOR' && (
            <>
              <View style={styles.seccion}>
                <Text style={styles.titulo}>Gestión de personal</Text>
                <Text style={styles.descripcion}>
                  Registra y administra las asistentes para permitirles gestionar citas y expedientes de pacientes.
                </Text>

                {/* Opción 1: Ver Lista de Asistentes */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('ListaAsistentes')}
                  style={({ pressed }) => [
                    styles.botonOpcion,
                    pressed && styles.presionado,
                  ]}
                >
                  <Ionicons name="people-outline" size={20} color={colors.primary} />
                  <View style={styles.textoContenedorOpcion}>
                    <Text style={styles.tituloOpcion}>Ver lista de asistentes</Text>
                    <Text style={styles.subtituloOpcion}>
                      Consulta y gestiona las cuentas activas
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </Pressable>

                {/* Opción 2: Registrar Nueva Asistente */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('CrearAsistente')}
                  style={({ pressed }) => [
                    styles.botonOpcion,
                    pressed && styles.presionado,
                  ]}
                >
                  <Ionicons name="person-add-outline" size={20} color={colors.primary} />
                  <View style={styles.textoContenedorOpcion}>
                    <Text style={styles.tituloOpcion}>Registrar Asistente</Text>
                    <Text style={styles.subtituloOpcion}>
                      Crear una cuenta vinculada a tu consultorio
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>

              <FormularioConsultorio
                key={JSON.stringify(consultorio)}
                consultorio={consultorio}
                cargando={cargandoConsultorio}
                actualizarConsultorio={actualizarConsultorio}
              />
            </>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => void logout()}
            style={({ pressed }) => [styles.botonSalir, pressed && styles.presionado]}
          >
            <Ionicons name="log-out-outline" size={20} color="#B91C1C" />
            <Text style={styles.textoSalir}>Cerrar sesión</Text>
          </Pressable>
        </ScrollView>
      </BlurTargetView>
      <FloatingTabBar
        rutaActiva="Ajustes"
        onNavegar={(ruta) => {
          if (user.rol === 'PACIENTE') {
            if (ruta === 'AgendaCitas') navigation.navigate('PortalPaciente', { seccion: 'citas' });
            else if (ruta === 'EducacionPaciente') navigation.navigate('EducacionPaciente');
          } else {
            navegar(ruta);
          }
        }}
        blurTarget={blurTarget}
        modoPaciente={user.rol === 'PACIENTE'}
      />
    </View>
  );
}

function FormularioConsultorio({
  consultorio,
  cargando,
  actualizarConsultorio,
}: {
  consultorio: DatosConsultorio;
  cargando: boolean;
  actualizarConsultorio: (datos: DatosConsultorio) => Promise<void>;
}) {
  const [formulario, setFormulario] = useState(consultorio);
  const [guardando, setGuardando] = useState(false);

  const actualizarCampo = (campo: keyof DatosConsultorio, valor: string) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const guardar = async () => {
    if (guardando || cargando) return;
    setGuardando(true);
    try {
      await actualizarConsultorio(formulario);
      Alert.alert('Ajustes guardados', 'Los datos del consultorio se guardaron en Supabase.');
    } catch (error) {
      Alert.alert(
        'No se pudieron guardar los ajustes',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={styles.seccion}>
      <Text style={styles.titulo}>Datos del consultorio</Text>
      <Text style={styles.descripcion}>
        Esta información se utiliza en los documentos clínicos y comprobantes.
      </Text>
      <Campo
        etiqueta="Nombre del doctor o profesionales"
        valor={formulario.nombreDoctor}
        onChangeText={(valor) => actualizarCampo('nombreDoctor', valor)}
      />
      <Campo
        etiqueta="Cédula profesional"
        valor={formulario.cedula}
        onChangeText={(valor) => actualizarCampo('cedula', valor)}
        keyboardType="numeric"
      />
      <Campo
        etiqueta="Nombre de la clínica"
        valor={formulario.nombreClinica}
        onChangeText={(valor) => actualizarCampo('nombreClinica', valor)}
      />
      <Campo
        etiqueta="Dirección"
        valor={formulario.direccion}
        onChangeText={(valor) => actualizarCampo('direccion', valor)}
        multiline
      />
      <Campo
        etiqueta="Teléfono"
        valor={formulario.telefono}
        onChangeText={(valor) => actualizarCampo('telefono', valor)}
        keyboardType="phone-pad"
      />
      <Pressable
        accessibilityRole="button"
        disabled={guardando || cargando}
        onPress={() => void guardar()}
        style={({ pressed }) => [
          styles.botonGuardar,
          (guardando || cargando) && styles.deshabilitado,
          pressed && !(guardando || cargando) && styles.presionado,
        ]}
      >
        {guardando ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.textoBoton}>
            {cargando ? 'Cargando datos…' : 'Guardar datos del consultorio'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function Campo({
  etiqueta,
  valor,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
}: {
  etiqueta: string;
  valor: string;
  onChangeText: (valor: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
}) {
  return (
    <View style={styles.campoContenedor}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilinea]}
        value={valor}
        onChangeText={onChangeText}
        placeholder={etiqueta}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  destinoBlur: { flex: 1 },
  pantalla: { flex: 1 },
  contenido: { padding: 16, paddingBottom: 110 },
  seccion: {
    padding: 16,
    marginBottom: 14,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  titulo: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  nombre: { marginTop: 12, color: colors.primary, fontSize: 16, fontWeight: '700' },
  secundario: { marginTop: 4, color: colors.textSecondary, fontSize: 13 },
  etiquetaRol: { marginTop: 12, color: colors.textSecondary, fontSize: 12 },
  descripcion: { marginTop: 6, marginBottom: 8, color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  
  botonOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  textoContenedorOpcion: {
    flex: 1,
    marginLeft: 12,
  },
  tituloOpcion: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtituloOpcion: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  campoContenedor: { marginTop: 12 },
  etiqueta: { marginBottom: 6, color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  multilinea: { minHeight: 82, paddingTop: 12 },
  botonGuardar: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  textoBoton: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  botonSalir: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: borderRadius.md,
    backgroundColor: '#FEF2F2',
  },
  textoSalir: { color: '#B91C1C', fontSize: 14, fontWeight: '700' },
  presionado: { opacity: 0.7 },
  deshabilitado: { opacity: 0.55 },
});