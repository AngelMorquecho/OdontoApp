import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, colors, shadows } from '../../constants/theme';
import { DatosConsultorio } from '../../context/ConsultorioContext';
import { Medicamento, Receta } from '../../types';
import { Paciente } from '../../types/paciente';
import { generarYCompartirPdfReceta } from '../../services/pdfRecetaService';

interface Props {
  paciente: Paciente;
  consultorio: DatosConsultorio;
  onGuardar: (receta: Receta) => Promise<void>;
  onCompletada?: () => void;
  deshabilitado?: boolean;
}

type CampoMedicamento = keyof Omit<Medicamento, 'id'>;

const CAMPOS_MEDICAMENTO: { campo: CampoMedicamento; etiqueta: string; ejemplo: string }[] = [
  { campo: 'nombre', etiqueta: 'Medicamento *', ejemplo: 'Nombre del medicamento' },
  { campo: 'dosis', etiqueta: 'Dosis *', ejemplo: 'Ej. 500 mg' },
  { campo: 'frecuencia', etiqueta: 'Frecuencia *', ejemplo: 'Ej. cada 8 horas' },
  { campo: 'duracion', etiqueta: 'Duración *', ejemplo: 'Ej. 5 días' },
  { campo: 'indicaciones', etiqueta: 'Indicaciones del medicamento', ejemplo: 'Ej. tomar después de alimentos' },
];

function nuevoMedicamento(): Medicamento {
  return {
    id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nombre: '',
    dosis: '',
    frecuencia: '',
    duracion: '',
    indicaciones: '',
  };
}

function fechaLocal(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export default function FormularioReceta({
  paciente,
  consultorio,
  onGuardar,
  onCompletada,
  deshabilitado = false,
}: Props) {
  const [diagnostico, setDiagnostico] = useState('');
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([nuevoMedicamento()]);
  const [indicacionesGenerales, setIndicacionesGenerales] = useState('');
  const [guardando, setGuardando] = useState(false);

  const actualizarMedicamento = (
    id: string,
    campo: CampoMedicamento,
    valor: string,
  ) => {
    setMedicamentos((actuales) =>
      actuales.map((medicamento) =>
        medicamento.id === id ? { ...medicamento, [campo]: valor } : medicamento,
      ),
    );
  };

  const guardar = async () => {
    if (!diagnostico.trim()) {
      Alert.alert('Falta el diagnóstico', 'Escribe el diagnóstico para la receta.');
      return;
    }
    const medicamentosConDatos = medicamentos.filter((medicamento) =>
      [medicamento.nombre, medicamento.dosis, medicamento.frecuencia, medicamento.duracion,
        medicamento.indicaciones].some((valor) => valor.trim()),
    );
    const medicamentoIncompleto = medicamentosConDatos.some((medicamento) =>
      !medicamento.nombre.trim() ||
      !medicamento.dosis.trim() ||
      !medicamento.frecuencia.trim() ||
      !medicamento.duracion.trim(),
    );
    if (medicamentoIncompleto) {
      Alert.alert(
        'Medicamento incompleto',
        'Completa nombre, dosis, frecuencia y duración, o elimina el medicamento vacío.',
      );
      return;
    }

    const receta: Receta = {
      id: `receta-${Date.now()}`,
      pacienteId: paciente.id,
      fechaEmision: fechaLocal(),
      diagnostico: diagnostico.trim(),
      medicamentos: medicamentosConDatos,
      indicacionesGenerales: indicacionesGenerales.trim(),
      estadoTratamiento: 'activo',
    };

    setGuardando(true);
    let recetaGuardada = false;
    try {
      await onGuardar(receta);
      recetaGuardada = true;
      setDiagnostico('');
      setMedicamentos([nuevoMedicamento()]);
      setIndicacionesGenerales('');
      await generarYCompartirPdfReceta(receta, paciente, consultorio);
      if (onCompletada) {
        onCompletada();
      } else {
        Alert.alert('Receta guardada', 'El PDF está listo para compartir o guardar.');
      }
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      Alert.alert(
        recetaGuardada ? 'Receta guardada' : 'No se pudo guardar la receta',
        recetaGuardada
          ? `La receta quedó guardada, pero no se pudo preparar el PDF: ${mensaje}. Puedes intentarlo desde el historial.`
          : mensaje,
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={styles.tarjeta}>
      <Text style={styles.tituloSeccion}>Nueva receta</Text>
      <Text style={styles.etiqueta}>Diagnóstico y motivo *</Text>
      <TextInput
        accessibilityLabel="Diagnóstico y motivo"
        value={diagnostico}
        onChangeText={setDiagnostico}
        placeholder="Describe el diagnóstico y motivo de la receta"
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlignVertical="top"
        style={[styles.input, styles.multilinea]}
      />

      <View style={styles.tituloMedicamentos}>
        <Text style={styles.tituloSeccion}>Medicamentos</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar medicamento"
          disabled={guardando || deshabilitado}
          onPress={() => setMedicamentos((actuales) => [...actuales, nuevoMedicamento()])}
          style={({ pressed }) => [styles.botonAgregar, pressed && styles.presionado]}
        >
          <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
          <Text style={styles.textoAgregar}>Agregar</Text>
        </Pressable>
      </View>

      {medicamentos.map((medicamento, indice) => (
        <View key={medicamento.id} style={styles.tarjetaMedicamento}>
          <View style={styles.encabezadoMedicamento}>
            <Text style={styles.subtitulo}>Medicamento {indice + 1}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Quitar medicamento ${indice + 1}`}
              disabled={guardando || deshabilitado}
              hitSlop={8}
              onPress={() =>
                setMedicamentos((actuales) =>
                  actuales.filter((item) => item.id !== medicamento.id),
                )
              }
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={19}
                color={colors.danger}
              />
            </Pressable>
          </View>
          {CAMPOS_MEDICAMENTO.map((campo) => (
            <View key={campo.campo}>
              <Text style={styles.etiqueta}>{campo.etiqueta}</Text>
              <TextInput
                accessibilityLabel={campo.etiqueta}
                value={medicamento[campo.campo]}
                onChangeText={(valor) =>
                  actualizarMedicamento(medicamento.id, campo.campo, valor)
                }
                placeholder={campo.ejemplo}
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
              />
            </View>
          ))}
        </View>
      ))}

      <Text style={styles.etiqueta}>Cuidados y recomendaciones post-atención</Text>
      <TextInput
        accessibilityLabel="Cuidados y recomendaciones post-atención"
        value={indicacionesGenerales}
        onChangeText={setIndicacionesGenerales}
        placeholder="Ej. aplicar hielo, dieta blanda, evitar irritantes..."
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlignVertical="top"
        style={[styles.input, styles.multilinea]}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: guardando || deshabilitado, busy: guardando }}
        disabled={guardando || deshabilitado}
        onPress={() => void guardar()}
        style={({ pressed }) => [
          styles.botonGuardar,
          pressed && !guardando && styles.presionado,
          (guardando || deshabilitado) && styles.botonDeshabilitado,
        ]}
      >
        <MaterialCommunityIcons name="file-pdf-box" size={20} color={colors.surface} />
        <Text style={styles.textoBotonGuardar}>
          {guardando ? 'Guardando receta…' : 'Guardar receta y generar PDF'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    ...shadows.sm,
  },
  tituloSeccion: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  etiqueta: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    fontSize: 14,
  },
  multilinea: {
    minHeight: 84,
  },
  tituloMedicamentos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  botonAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  textoAgregar: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  tarjetaMedicamento: {
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  encabezadoMedicamento: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitulo: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  botonGuardar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    marginTop: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  textoBotonGuardar: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  presionado: {
    opacity: 0.7,
  },
  botonDeshabilitado: {
    opacity: 0.55,
  },
});
