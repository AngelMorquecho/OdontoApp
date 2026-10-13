import React, { useEffect, useRef, useState } from 'react';
import { BlurTargetView } from 'expo-blur';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DatosConsultorio, useConsultorio } from '../context/ConsultorioContext';
import { usePacientes } from '../context/PacientesContext';
import PanelRespaldo from '../components/PanelRespaldo';
import FloatingTabBar, { FloatingTabRoute } from '../components/FloatingTabBar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { borderRadius, colors, shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import type { Usuario } from '../types';
import type { Paciente } from '../types/paciente';

type Props = NativeStackScreenProps<RootStackParamList, 'Ajustes'>;

export default function AjustesScreen({ route, navigation }: Props) {
  const blurTarget = useRef<View | null>(null);
  const { user, seleccionarRolDoctor, seleccionarPaciente } = useAuth();
  const {
    consultorio,
    cargandoConsultorio,
    actualizarConsultorio,
    restaurarConsultorio,
  } = useConsultorio();
  const { pacientes, reemplazarPacientes } = usePacientes();

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

  if (user.rol === 'paciente') {
    return (
      <View style={styles.root}>
        <BlurTargetView ref={blurTarget} style={styles.destinoBlur}>
          <PerfilPaciente
            user={user}
            pacientes={pacientes}
            seleccionarRolDoctor={seleccionarRolDoctor}
            seleccionarPaciente={seleccionarPaciente}
            onVolver={(seccion) =>
              navigation.navigate('PortalPaciente', { seccion })
            }
          />
        </BlurTargetView>
        <FloatingTabBar
          rutaActiva="Ajustes"
          onNavegar={(ruta) => {
            if (ruta === 'AgendaCitas') {
              navigation.navigate('PortalPaciente', { seccion: 'citas' });
            } else if (ruta === 'ListaPacientes') {
              navigation.navigate('PortalPaciente', { seccion: 'tratamiento' });
            }
          }}
          blurTarget={blurTarget}
          modoPaciente
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <BlurTargetView ref={blurTarget} style={styles.destinoBlur}>
        <FormularioAjustes
          key={JSON.stringify(consultorio)}
          route={route}
          consultorio={consultorio}
          cargandoConsultorio={cargandoConsultorio}
          actualizarConsultorio={actualizarConsultorio}
          restaurarConsultorio={restaurarConsultorio}
          pacientes={pacientes}
          reemplazarPacientes={reemplazarPacientes}
          user={user}
          seleccionarRolDoctor={seleccionarRolDoctor}
          seleccionarPaciente={seleccionarPaciente}
        />
      </BlurTargetView>
      <FloatingTabBar
        rutaActiva="Ajustes"
        onNavegar={navegar}
        blurTarget={blurTarget}
      />
    </View>
  );
}

interface FormularioAjustesProps {
  route: Props['route'];
  consultorio: DatosConsultorio;
  cargandoConsultorio: boolean;
  actualizarConsultorio: (datos: DatosConsultorio) => Promise<void>;
  restaurarConsultorio: (datos: DatosConsultorio) => Promise<void>;
  pacientes: ReturnType<typeof usePacientes>['pacientes'];
  reemplazarPacientes: ReturnType<typeof usePacientes>['reemplazarPacientes'];
  user: Usuario;
  seleccionarRolDoctor: () => void;
  seleccionarPaciente: (paciente: Paciente) => void;
}

function FormularioAjustes({
  route,
  consultorio,
  cargandoConsultorio,
  actualizarConsultorio,
  restaurarConsultorio,
  pacientes,
  reemplazarPacientes,
  user,
  seleccionarRolDoctor,
  seleccionarPaciente,
}: FormularioAjustesProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [offsetRespaldo, setOffsetRespaldo] = useState(0);
  const [formulario, setFormulario] = useState(consultorio);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (route.params?.seccion === 'respaldo') {
      scrollRef.current?.scrollTo({ y: offsetRespaldo, animated: true });
    }
  }, [offsetRespaldo, route.params?.seccion]);

  const actualizarCampo = (campo: keyof typeof formulario, valor: string) => {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await actualizarConsultorio(formulario);
      Alert.alert('Ajustes guardados', 'Los datos del consultorio se guardaron correctamente.');
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
    <ScrollView
      ref={scrollRef}
      style={styles.pantalla}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>Simulador de roles</Text>
        <Text style={styles.textoSimulador}>
          Prueba la experiencia del doctor o entra al portal como un paciente.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: user.rol === 'doctor' }}
          onPress={seleccionarRolDoctor}
          style={({ pressed }) => [
            styles.opcionRol,
            styles.opcionRolSeleccionada,
            pressed && styles.botonPresionado,
          ]}
        >
          <Text style={styles.textoOpcionSeleccionada}>Vista Doctor</Text>
          <Text style={styles.textoRolSecundario}>Interfaz administrativa completa</Text>
        </Pressable>
        <Text style={styles.etiquetaPaciente}>Vista Paciente</Text>
        {pacientes.length === 0 ? (
          <Text style={styles.textoSimulador}>No hay pacientes para probar el portal.</Text>
        ) : (
          pacientes.map((paciente) => (
            <Pressable
              key={paciente.id}
              accessibilityRole="button"
              accessibilityState={{ selected: user.pacienteId === paciente.id }}
              onPress={() => seleccionarPaciente(paciente)}
              style={({ pressed }) => [
                styles.opcionRol,
                user.pacienteId === paciente.id && styles.opcionRolSeleccionada,
                pressed && styles.botonPresionado,
              ]}
            >
              <Text
                style={[
                  styles.textoOpcionRol,
                  user.pacienteId === paciente.id && styles.textoOpcionSeleccionada,
                ]}
              >
                {paciente.nombre}
              </Text>
              <Text style={styles.textoRolSecundario}>
                {paciente.correo ?? 'Perfil de prueba'}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      <Text style={styles.introduccion}>
        Estos datos aparecerán en el membrete de los expedientes clínicos exportados.
      </Text>

      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>Datos del consultorio</Text>
        <Campo
          etiqueta="Nombre del doctor o profesionales"
          valor={formulario.nombreDoctor}
          placeholder="Nombre(s) completo(s)"
          onChangeText={(valor) => actualizarCampo('nombreDoctor', valor)}
        />
        <Campo
          etiqueta="Cédula profesional"
          valor={formulario.cedula}
          placeholder="Número de cédula"
          onChangeText={(valor) => actualizarCampo('cedula', valor)}
        />
        <Campo
          etiqueta="Nombre de la clínica"
          valor={formulario.nombreClinica}
          placeholder="Nombre comercial (opcional)"
          onChangeText={(valor) => actualizarCampo('nombreClinica', valor)}
        />
        <Campo
          etiqueta="Dirección"
          valor={formulario.direccion}
          placeholder="Dirección del consultorio"
          onChangeText={(valor) => actualizarCampo('direccion', valor)}
          multiline
        />
        <Campo
          etiqueta="Teléfono"
          valor={formulario.telefono}
          placeholder="Teléfono de contacto"
          keyboardType="phone-pad"
          onChangeText={(valor) => actualizarCampo('telefono', valor)}
        />
        <Pressable
          accessibilityRole="button"
          disabled={guardando || cargandoConsultorio}
          onPress={() => void guardar()}
          style={({ pressed }) => [
            styles.botonGuardar,
            (guardando || cargandoConsultorio) && styles.botonDeshabilitado,
            pressed && !(guardando || cargandoConsultorio) && styles.botonPresionado,
          ]}
        >
          <Text style={styles.textoBotonGuardar}>
            {cargandoConsultorio
              ? 'Cargando datos…'
              : guardando
                ? 'Guardando…'
                : 'Guardar datos del consultorio'}
          </Text>
        </Pressable>
      </View>

      <View
        style={styles.seccion}
        onLayout={(evento) => setOffsetRespaldo(evento.nativeEvent.layout.y)}
      >
        <Text style={styles.tituloSeccion}>Respaldo de datos</Text>
        <PanelRespaldo
          pacientes={pacientes}
          consultorio={consultorio}
          deshabilitado={cargandoConsultorio}
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
    </ScrollView>
  );
}

interface PerfilPacienteProps {
  user: Usuario;
  pacientes: ReturnType<typeof usePacientes>['pacientes'];
  seleccionarRolDoctor: () => void;
  seleccionarPaciente: (paciente: Paciente) => void;
  onVolver: (seccion: 'citas' | 'tratamiento') => void;
}

function PerfilPaciente({
  user,
  pacientes,
  seleccionarRolDoctor,
  seleccionarPaciente,
  onVolver,
}: PerfilPacienteProps) {
  return (
    <ScrollView
      style={styles.pantalla}
      contentContainerStyle={styles.contenido}
    >
      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>Mi perfil</Text>
        <Text style={styles.nombrePerfil}>{user.nombre}</Text>
        <Text style={styles.textoSimulador}>{user.email}</Text>
      </View>
      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>Cambiar vista de prueba</Text>
        <Text style={styles.textoSimulador}>
          El simulador permite revisar ambos portales en este dispositivo.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={seleccionarRolDoctor}
          style={({ pressed }) => [
            styles.botonRolDoctor,
            pressed && styles.botonPresionado,
          ]}
        >
          <Text style={styles.textoBotonRol}>Cambiar a Vista Doctor</Text>
        </Pressable>
        <Text style={styles.etiquetaPaciente}>Cambiar paciente de prueba</Text>
        {pacientes.map((paciente) => (
          <Pressable
            key={paciente.id}
            accessibilityRole="button"
            accessibilityState={{ selected: user.pacienteId === paciente.id }}
            onPress={() => seleccionarPaciente(paciente)}
            style={({ pressed }) => [
              styles.opcionRol,
              user.pacienteId === paciente.id && styles.opcionRolSeleccionada,
              pressed && styles.botonPresionado,
            ]}
          >
            <Text
              style={[
                styles.textoOpcionRol,
                user.pacienteId === paciente.id && styles.textoOpcionSeleccionada,
              ]}
            >
              {paciente.nombre}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>Acceso rápido</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onVolver('citas')}
          style={({ pressed }) => [
            styles.opcionAcceso,
            pressed && styles.botonPresionado,
          ]}
        >
          <Text style={styles.textoOpcionRol}>Mis Citas</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onVolver('tratamiento')}
          style={({ pressed }) => [
            styles.opcionAcceso,
            pressed && styles.botonPresionado,
          ]}
        >
          <Text style={styles.textoOpcionRol}>Tratamiento y Recetas</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

interface CampoProps {
  etiqueta: string;
  valor: string;
  placeholder: string;
  onChangeText: (valor: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad';
}

function Campo({
  etiqueta,
  valor,
  placeholder,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
}: CampoProps) {
  const [enfocado, setEnfocado] = useState(false);

  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={[
          styles.input,
          enfocado && styles.inputEnfocado,
          multiline && styles.inputMultiline,
        ]}
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="sentences"
        autoCorrect={false}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  destinoBlur: { flex: 1 },
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: 16,
    paddingBottom: 120,
  },
  introduccion: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  seccion: {
    padding: 16,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    marginBottom: 14,
    ...shadows.sm,
  },
  tituloSeccion: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  campo: {
    marginBottom: 13,
  },
  etiqueta: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontSize: 15,
    backgroundColor: colors.surface,
  },
  inputEnfocado: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  inputMultiline: {
    minHeight: 82,
    paddingTop: 11,
    paddingBottom: 11,
  },
  botonGuardar: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  botonDeshabilitado: {
    opacity: 0.55,
  },
  botonPresionado: {
    opacity: 0.7,
  },
  textoBotonGuardar: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  textoSimulador: {
    marginBottom: 10,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  etiquetaPaciente: {
    marginTop: 10,
    marginBottom: 7,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  opcionRol: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  opcionRolSeleccionada: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  textoOpcionRol: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  textoOpcionSeleccionada: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  textoRolSecundario: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 12,
  },
  nombrePerfil: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '700',
  },
  botonRolDoctor: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  textoBotonRol: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  opcionAcceso: {
    padding: 12,
    marginTop: 7,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
});
