import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import CampoTexto from '../campos/CampoTexto';
import CampoSiNo from '../campos/CampoSiNo';
import CampoOpciones from '../campos/CampoOpciones';
import CampoCheckbox from '../campos/CampoCheckbox';
import { TODOS_LOS_DIENTES } from '../types/odontograma';
import { NotaEvolucion, Pronostico, SiNo } from '../../types/paciente';

interface Props {
  tratantePorDefecto?: string;
  onGuardar: (nota: NotaEvolucion) => void;
  onCancelar: () => void;
}

const OPCIONES_PRONOSTICO: { valor: Pronostico; etiqueta: string }[] = [
  { valor: 'Favorable', etiqueta: 'Favorable' },
  { valor: 'Reservado', etiqueta: 'Reservado' },
  { valor: 'Desfavorable', etiqueta: 'Desfavorable' },
];

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function horaAhora(): string {
  return new Date().toTimeString().slice(0, 5);
}

/** Formulario para capturar una nueva nota de evolución clínica. */
export default function FormularioNotaEvolucion({
  tratantePorDefecto = '',
  onGuardar,
  onCancelar,
}: Props) {
  const [regionOD, setRegionOD] = useState('');
  const [evolucionProcedimiento, setEvolucionProcedimiento] = useState('');
  const [dx, setDx] = useState('');
  const [pronostico, setPronostico] = useState<Pronostico>('Favorable');
  const [plan, setPlan] = useState('');
  const [anestesia, setAnestesia] = useState<SiNo>('no');
  const [rx, setRx] = useState(false);
  const [fotos, setFotos] = useState(false);
  const [escaneo, setEscaneo] = useState(false);
  const [cbct, setCbct] = useState(false);
  const [receta, setReceta] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [proximaCita, setProximaCita] = useState('');
  const [tratante, setTratante] = useState(tratantePorDefecto);

  const guardar = () => {
    if (!regionOD.trim()) {
      Alert.alert('Falta información', 'Indica la región u órgano dentario (ej. 16, 36).');
      return;
    }
    if (!evolucionProcedimiento.trim()) {
      Alert.alert('Falta información', 'Describe la evolución o el procedimiento realizado.');
      return;
    }

    const nota: NotaEvolucion = {
      id: `nota-${Date.now()}`,
      fecha: fechaHoy(),
      hora: horaAhora(),
      regionOD: regionOD.trim(),
      evolucionProcedimiento: evolucionProcedimiento.trim(),
      dx: dx.trim(),
      pronostico,
      plan: plan.trim(),
      anestesia,
      estudios: { rx, fotos, escaneo, cbct },
      receta: receta.trim(),
      indicaciones: indicaciones.trim(),
      proximaCita: proximaCita.trim(),
      tratante: tratante.trim(),
    };
    onGuardar(nota);
  };

  const alternarDienteEnRegion = (numero: number) => {
    const texto = String(numero);
    const piezas = regionOD
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (piezas.includes(texto)) {
      setRegionOD(piezas.filter((p) => p !== texto).join(', '));
    } else {
      setRegionOD([...piezas, texto].join(', '));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contenedor}>
        <Text style={styles.etiqueta}>Región / órgano dentario (FDI)</Text>
        <View style={styles.chipsDientes}>
          {TODOS_LOS_DIENTES.map((numero) => {
            const seleccionado = regionOD
              .split(',')
              .map((p) => p.trim())
              .includes(String(numero));
            return (
              <Pressable
                key={numero}
                onPress={() => alternarDienteEnRegion(numero)}
                style={({ pressed }) => [
                  styles.chipDiente,
                  seleccionado && styles.chipDienteSeleccionado,
                  pressed && styles.botonPresionado,
                ]}
              >
                <Text
                  style={[
                    styles.chipDienteTexto,
                    seleccionado && styles.chipDienteTextoSeleccionado,
                  ]}
                >
                  {numero}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <CampoTexto
          etiqueta="Región / OD (texto libre)"
          value={regionOD}
          onChangeText={setRegionOD}
          placeholder="Ej. 16, 17 o 'cuadrante superior derecho'"
        />

        <CampoTexto
          etiqueta="Evolución / procedimiento realizado"
          value={evolucionProcedimiento}
          onChangeText={setEvolucionProcedimiento}
          multiline
        />
        <CampoTexto etiqueta="Diagnóstico (Dx)" value={dx} onChangeText={setDx} multiline />
        <CampoOpciones
          etiqueta="Pronóstico"
          valor={pronostico}
          opciones={OPCIONES_PRONOSTICO}
          onChange={setPronostico}
        />
        <CampoTexto etiqueta="Plan" value={plan} onChangeText={setPlan} multiline />
        <CampoSiNo etiqueta="¿Se aplicó anestesia?" valor={anestesia} onChange={setAnestesia} />

        <Text style={styles.etiqueta}>Estudios complementarios</Text>
        <View style={styles.filaCheckboxes}>
          <CampoCheckbox etiqueta="Rx" marcado={rx} onChange={setRx} />
          <CampoCheckbox etiqueta="Fotos" marcado={fotos} onChange={setFotos} />
          <CampoCheckbox etiqueta="Escaneo" marcado={escaneo} onChange={setEscaneo} />
          <CampoCheckbox etiqueta="CBCT" marcado={cbct} onChange={setCbct} />
        </View>

        <CampoTexto etiqueta="Receta" value={receta} onChangeText={setReceta} multiline />
        <CampoTexto
          etiqueta="Indicaciones"
          value={indicaciones}
          onChangeText={setIndicaciones}
          multiline
        />
        <CampoTexto
          etiqueta="Próxima cita (AAAA-MM-DD)"
          value={proximaCita}
          onChangeText={setProximaCita}
          placeholder="2026-11-01"
        />
        <CampoTexto etiqueta="Tratante" value={tratante} onChangeText={setTratante} />

        <View style={styles.filaBotones}>
          <Pressable
            style={({ pressed }) => [
              styles.boton,
              styles.botonSecundario,
              pressed && styles.botonPresionado,
            ]}
            onPress={onCancelar}
          >
            <Text style={styles.botonSecundarioTexto}>Cancelar</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.boton, pressed && styles.botonPresionado]}
            onPress={guardar}
          >
            <Text style={styles.botonTexto}>Guardar nota</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contenedor: {
    padding: 16,
    paddingBottom: 32,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#455A64',
    marginBottom: 8,
  },
  chipsDientes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chipDiente: {
    width: 40,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 6,
  },
  chipDienteSeleccionado: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  chipDienteTexto: {
    fontSize: 12,
    color: '#455A64',
    fontWeight: '600',
  },
  chipDienteTextoSeleccionado: {
    color: '#fff',
  },
  filaCheckboxes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  filaBotones: {
    flexDirection: 'row',
    marginTop: 16,
  },
  boton: {
    flex: 1,
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 8,
  },
  botonSecundario: {
    backgroundColor: '#ECEFF1',
    marginLeft: 0,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  botonSecundarioTexto: {
    color: '#455A64',
    fontSize: 16,
    fontWeight: '700',
  },
  botonPresionado: {
    opacity: 0.7,
  },
});
