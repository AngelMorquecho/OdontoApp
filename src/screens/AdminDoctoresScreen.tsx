import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
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
import type { CuentaDoctor, EstadoSuscripcion } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  actualizarDoctor,
  EstadoDoctor,
  listarDoctores,
  obtenerEstadoDoctor,
  registrarDoctor,
} from '../services/doctores';
import { borderRadius, colors, shadows } from '../constants/theme';

const FORMULARIO_VACIO = {
  nombre: '',
  especialidad: '',
  cedula: '',
  email: '',
  passwordTemporal: '',
  limitePacientes: '',
};

function fechaLocal(fecha: Date): string {
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, '0'),
    String(fecha.getDate()).padStart(2, '0'),
  ].join('-');
}

export default function AdminDoctoresScreen() {
  const { user, logout } = useAuth();
  const [doctores, setDoctores] = useState<CuentaDoctor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [suscripcion, setSuscripcion] = useState<EstadoSuscripcion>('activa');
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [licenciaEnCurso, setLicenciaEnCurso] = useState<string | null>(null);

  const cargarDoctores = useCallback(async () => {
    try {
      setDoctores(await listarDoctores());
    } catch (error) {
      Alert.alert(
        'No se pudieron cargar los doctores',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    listarDoctores()
      .then((resultado) => {
        if (activo) setDoctores(resultado);
      })
      .catch((error: unknown) => {
        Alert.alert(
          'No se pudieron cargar los doctores',
          error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const modificarSuscripcion = async (
    doctor: CuentaDoctor,
    suscripcionNueva: EstadoSuscripcion,
  ) => {
    if (licenciaEnCurso) return;
    setLicenciaEnCurso(doctor.id);
    try {
      const vencimiento = new Date();
      vencimiento.setDate(vencimiento.getDate() + 30);
      await actualizarDoctor(doctor.id, {
        suscripcion: suscripcionNueva,
        ...(suscripcionNueva === 'activa'
        ? { fechaVencimiento: fechaLocal(vencimiento) }
          : {}),
      });
      await cargarDoctores();
    } catch (error) {
      Alert.alert(
        'No se pudo actualizar la suscripción',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setLicenciaEnCurso(null);
    }
  };

  const actualizarCampo = (campo: keyof typeof FORMULARIO_VACIO, valor: string) => {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  };

  const guardarDoctor = async () => {
    const { nombre, especialidad, cedula, email, passwordTemporal, limitePacientes } =
      formulario;
    if (
      !nombre.trim() ||
      !especialidad.trim() ||
      !cedula.trim() ||
      !email.trim() ||
      !passwordTemporal.trim()
    ) {
      Alert.alert('Faltan datos', 'Completa nombre, especialidad, cédula, correo y contraseña temporal.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Correo no válido', 'Verifica el correo de acceso del doctor.');
      return;
    }
    if (passwordTemporal.trim().length < 8) {
      Alert.alert('Contraseña no válida', 'La contraseña temporal debe tener al menos 8 caracteres.');
      return;
    }
    if (
      limitePacientes &&
      (!/^\d+$/.test(limitePacientes) ||
        !Number.isSafeInteger(Number(limitePacientes)) ||
        Number(limitePacientes) < 1)
    ) {
      Alert.alert('Límite no válido', 'El límite de pacientes debe ser un entero mayor que cero.');
      return;
    }

    const vencimiento = new Date();
    vencimiento.setDate(vencimiento.getDate() + 30);
    setGuardando(true);
    try {
      await registrarDoctor({
        nombre: nombre.trim(),
        especialidad: especialidad.trim(),
        cedula: cedula.trim(),
        email: email.trim(),
        passwordTemporal: passwordTemporal.trim(),
        suscripcion,
        ...(limitePacientes ? { limitePacientes: Number(limitePacientes) } : {}),
        fechaVencimiento: fechaLocal(vencimiento),
      });
      await cargarDoctores();
      setFormulario(FORMULARIO_VACIO);
      setSuscripcion('activa');
      setMostrarFormulario(false);
      Alert.alert('Doctor registrado', 'La cuenta de acceso y la licencia quedaron guardadas.');
    } catch (error) {
      Alert.alert(
        'No se pudo registrar al doctor',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setGuardando(false);
    }
  };

  if (user?.rol !== 'SUPER_ADMIN') {
    return (
      <View style={styles.bloqueado}>
        <Ionicons name="lock-closed-outline" size={32} color={colors.textSecondary} />
        <Text style={styles.textoBloqueado}>Acceso exclusivo para SuperAdmin.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.pantalla}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.encabezado}>
        <View style={styles.encabezadoTexto}>
          <Text style={styles.titulo}>Gestión de licencias</Text>
          <Text style={styles.subtitulo}>Administra cuentas y suscripciones de doctores.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          onPress={() => void logout()}
          style={({ pressed }) => [styles.botonSalir, pressed && styles.presionado]}
        >
          <Ionicons name="log-out-outline" size={21} color="#B91C1C" />
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setMostrarFormulario((visible) => !visible)}
        style={({ pressed }) => [
          styles.botonAlta,
          pressed && styles.presionado,
        ]}
      >
        <Ionicons name={mostrarFormulario ? 'close' : 'add'} size={21} color={colors.surface} />
        <Text style={styles.textoBotonAlta}>
          {mostrarFormulario ? 'Cancelar alta' : 'Alta de Doctor'}
        </Text>
      </Pressable>

      {mostrarFormulario && (
        <View style={styles.tarjetaFormulario}>
          <Text style={styles.tituloSeccion}>Datos de la cuenta</Text>
          <Campo label="Nombre completo *" value={formulario.nombre} onChangeText={(v) => actualizarCampo('nombre', v)} />
          <Campo label="Especialidad *" value={formulario.especialidad} onChangeText={(v) => actualizarCampo('especialidad', v)} />
          <Campo label="Cédula profesional *" value={formulario.cedula} onChangeText={(v) => actualizarCampo('cedula', v)} keyboardType="numeric" />
          <Campo label="Correo de acceso *" value={formulario.email} onChangeText={(v) => actualizarCampo('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <Campo label="Contraseña temporal *" value={formulario.passwordTemporal} onChangeText={(v) => actualizarCampo('passwordTemporal', v)} secureTextEntry />
          <Campo label="Límite de pacientes (opcional)" value={formulario.limitePacientes} onChangeText={(v) => actualizarCampo('limitePacientes', v.replace(/\D/g, ''))} keyboardType="numeric" />

          <Text style={styles.etiqueta}>Suscripción</Text>
          <View style={styles.filaSuscripcion}>
            {(['activa', 'inactiva'] as const).map((estado) => (
              <Pressable
                key={estado}
                accessibilityRole="button"
                accessibilityState={{ selected: suscripcion === estado }}
                onPress={() => setSuscripcion(estado)}
                style={({ pressed }) => [
                  styles.opcionSuscripcion,
                  suscripcion === estado && styles.opcionSuscripcionActiva,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={[
                  styles.textoOpcionSuscripcion,
                  suscripcion === estado && styles.textoOpcionSuscripcionActivo,
                ]}>
                  {estado === 'activa' ? 'Activa' : 'Inactiva'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.notaTemporal}>
            El acceso se crea en Supabase Auth. La contraseña temporal solo se usa para el alta y no se conserva en la aplicación.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={guardando}
            onPress={() => void guardarDoctor()}
            style={({ pressed }) => [
              styles.botonGuardar,
              pressed && !guardando && styles.presionado,
              guardando && styles.deshabilitado,
            ]}
          >
            <Text style={styles.textoBotonGuardar}>
              {guardando ? 'Guardando…' : 'Registrar doctor'}
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.encabezadoLista}>
        <Text style={styles.tituloSeccion}>Doctores registrados</Text>
        <Text style={styles.contador}>{doctores.length}</Text>
      </View>
      {cargando ? (
        <ActivityIndicator color={colors.primary} style={styles.cargando} />
      ) : doctores.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.textoVacio}>Aún no hay doctores registrados.</Text>
        </View>
      ) : (
        doctores.map((doctor) => (
          <TarjetaDoctor
            key={doctor.id}
            doctor={doctor}
            cargando={licenciaEnCurso === doctor.id}
            onCambiarSuscripcion={(estado) => void modificarSuscripcion(doctor, estado)}
          />
        ))
      )}
    </ScrollView>
  );
}

function Campo({
  label,
  keyboardType = 'default',
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <>
      <Text style={styles.etiqueta}>{label}</Text>
      <TextInput
        {...props}
        style={styles.input}
        placeholder={label.replace(' *', '')}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        autoCapitalize={props.autoCapitalize ?? 'sentences'}
        autoCorrect={false}
      />
    </>
  );
}

function TarjetaDoctor({
  doctor,
  cargando,
  onCambiarSuscripcion,
}: {
  doctor: CuentaDoctor;
  cargando: boolean;
  onCambiarSuscripcion: (estado: EstadoSuscripcion) => void;
}) {
  const estado = obtenerEstadoDoctor(doctor);
  const colorEstado = COLORES_ESTADO[estado];
  return (
    <View style={styles.tarjetaDoctor}>
      <View style={styles.filaDoctor}>
        <View style={styles.avatarDoctor}>
          <Ionicons name="medkit-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.datosDoctor}>
          <Text style={styles.nombreDoctor}>{doctor.nombre}</Text>
          <Text style={styles.detalleDoctor}>{doctor.especialidad} · Cédula {doctor.cedula}</Text>
          <Text style={styles.detalleDoctor}>{doctor.email}</Text>
        </View>
        <View style={[styles.badgeEstado, { backgroundColor: colorEstado.fondo }]}>
          <Text style={[styles.textoEstado, { color: colorEstado.texto }]}>
            {etiquetaEstado(estado)}
          </Text>
        </View>
      </View>
      <View style={styles.detallesSuscripcion}>
        <Text style={styles.textoMeta}>
          Suscripción: {doctor.suscripcion === 'activa' ? 'Activa' : 'Inactiva'}
        </Text>
        <Text style={styles.textoMeta}>Vence: {doctor.fechaVencimiento}</Text>
        <Text style={styles.textoMeta}>
          Pacientes: {doctor.limitePacientes ?? 'Sin límite'}
        </Text>
      </View>
      <View style={styles.filaAcciones}>
        <Pressable
          accessibilityRole="button"
          disabled={cargando}
          onPress={() =>
            onCambiarSuscripcion(doctor.suscripcion === 'activa' ? 'inactiva' : 'activa')
          }
          style={({ pressed }) => [
            styles.botonAccion,
            doctor.suscripcion === 'activa' ? styles.botonSuspender : styles.botonActivar,
            cargando && styles.deshabilitado,
            pressed && styles.presionado,
          ]}
        >
          <Text style={[
            styles.textoAccion,
            doctor.suscripcion === 'activa' ? styles.textoSuspender : styles.textoActivar,
          ]}>
            {cargando ? 'Actualizando…' : doctor.suscripcion === 'activa' ? 'Suspender' : 'Activar'}
          </Text>
        </Pressable>
        {estado === 'vencido' && (
          <Pressable
            accessibilityRole="button"
            disabled={cargando}
            onPress={() => onCambiarSuscripcion('activa')}
            style={({ pressed }) => [
              styles.botonAccion,
              styles.botonActivar,
              cargando && styles.deshabilitado,
              pressed && styles.presionado,
            ]}
          >
            <Text style={[styles.textoAccion, styles.textoActivar]}>Renovar 30 días</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const COLORES_ESTADO: Record<EstadoDoctor, { fondo: string; texto: string }> = {
  activo: { fondo: '#DCFCE7', texto: '#15803D' },
  inactivo: { fondo: '#F1F5F9', texto: '#475569' },
  vencido: { fondo: '#FEE2E2', texto: '#B91C1C' },
};

function etiquetaEstado(estado: EstadoDoctor) {
  if (estado === 'activo') return 'Activo';
  if (estado === 'inactivo') return 'Inactivo';
  return 'Vencido';
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.background },
  contenido: { padding: 16, paddingBottom: 40 },
  encabezado: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  encabezadoTexto: { flex: 1 },
  titulo: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitulo: { marginTop: 4, color: colors.textSecondary, fontSize: 13 },
  botonSalir: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: '#FEE2E2',
  },
  botonAlta: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  textoBotonAlta: { color: colors.surface, fontWeight: '700' },
  tarjetaFormulario: {
    marginTop: 14,
    padding: 16,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tituloSeccion: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  etiqueta: { marginTop: 12, marginBottom: 6, color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  filaSuscripcion: { flexDirection: 'row', gap: 10 },
  opcionSuscripcion: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  opcionSuscripcionActiva: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  textoOpcionSuscripcion: { color: colors.textSecondary, fontWeight: '600' },
  textoOpcionSuscripcionActivo: { color: colors.primary },
  notaTemporal: { marginTop: 10, color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  botonGuardar: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  textoBotonGuardar: { color: colors.surface, fontWeight: '700' },
  deshabilitado: { opacity: 0.55 },
  encabezadoLista: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10 },
  contador: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: 'hidden',
    borderRadius: borderRadius.full,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  cargando: { marginTop: 24 },
  vacio: { padding: 18, borderRadius: borderRadius.md, backgroundColor: colors.surface },
  textoVacio: { color: colors.textSecondary, textAlign: 'center' },
  tarjetaDoctor: {
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  filaDoctor: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarDoctor: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  datosDoctor: { flex: 1, minWidth: 0 },
  nombreDoctor: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  detalleDoctor: { marginTop: 3, color: colors.textSecondary, fontSize: 11 },
  badgeEstado: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: borderRadius.full },
  textoEstado: { fontSize: 11, fontWeight: '700' },
  detallesSuscripcion: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textoMeta: { color: colors.textSecondary, fontSize: 11 },
  filaAcciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  botonAccion: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
  },
  botonSuspender: { backgroundColor: '#FEE2E2' },
  textoSuspender: { color: '#B91C1C' },
  botonActivar: { backgroundColor: '#DCFCE7' },
  textoActivar: { color: '#15803D' },
  textoAccion: { fontSize: 12, fontWeight: '700' },
  bloqueado: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  textoBloqueado: { color: colors.textSecondary, fontWeight: '600' },
  presionado: { opacity: 0.7 },
});
