import React, { useEffect, useRef, useState } from 'react';
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Ajustes'>;

export default function AjustesScreen({ route }: Props) {
  const {
    consultorio,
    cargandoConsultorio,
    actualizarConsultorio,
    restaurarConsultorio,
  } = useConsultorio();
  const { pacientes, reemplazarPacientes } = usePacientes();

  return (
    <FormularioAjustes
      key={JSON.stringify(consultorio)}
      route={route}
      consultorio={consultorio}
      cargandoConsultorio={cargandoConsultorio}
      actualizarConsultorio={actualizarConsultorio}
      restaurarConsultorio={restaurarConsultorio}
      pacientes={pacientes}
      reemplazarPacientes={reemplazarPacientes}
    />
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
}

function FormularioAjustes({
  route,
  consultorio,
  cargandoConsultorio,
  actualizarConsultorio,
  restaurarConsultorio,
  pacientes,
  reemplazarPacientes,
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
          style={[
            styles.botonGuardar,
            (guardando || cargandoConsultorio) && styles.botonDeshabilitado,
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
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#90A4AE"
        autoCapitalize="sentences"
        autoCorrect={false}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  contenido: {
    padding: 16,
    paddingBottom: 32,
  },
  introduccion: {
    color: '#546E7A',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  seccion: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#fff',
    marginBottom: 14,
  },
  tituloSeccion: {
    color: '#263238',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  campo: {
    marginBottom: 13,
  },
  etiqueta: {
    color: '#455A64',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    borderRadius: 9,
    paddingHorizontal: 12,
    color: '#263238',
    fontSize: 15,
    backgroundColor: '#fff',
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
    borderRadius: 10,
    backgroundColor: '#1565C0',
    marginTop: 4,
  },
  botonDeshabilitado: {
    opacity: 0.55,
  },
  textoBotonGuardar: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
