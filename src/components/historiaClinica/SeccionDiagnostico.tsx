import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CampoTexto from '../campos/CampoTexto';
import CampoOpciones from '../campos/CampoOpciones';
import { HistoriaClinica, Pronostico } from '../../types/paciente';

interface Props {
  historiaClinica: HistoriaClinica;
  onChange: (nueva: HistoriaClinica) => void;
}

const OPCIONES_PRONOSTICO: { valor: Pronostico; etiqueta: string }[] = [
  { valor: 'Favorable', etiqueta: 'Favorable' },
  { valor: 'Reservado', etiqueta: 'Reservado' },
  { valor: 'Desfavorable', etiqueta: 'Desfavorable' },
];

/** Sección de diagnóstico y plan de tratamiento general. */
export default function SeccionDiagnostico({ historiaClinica, onChange }: Props) {
  const { diagnosticoPlan: dp } = historiaClinica;

  return (
    <View>
      <Text style={styles.subtitulo}>Diagnóstico y plan de tratamiento</Text>
      <CampoTexto
        etiqueta="Diagnósticos"
        value={dp.diagnosticos}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            diagnosticoPlan: { ...dp, diagnosticos: v },
          })
        }
        multiline
      />
      <CampoOpciones
        etiqueta="Pronóstico"
        valor={dp.pronostico}
        opciones={OPCIONES_PRONOSTICO}
        onChange={(v) =>
          onChange({
            ...historiaClinica,
            diagnosticoPlan: { ...dp, pronostico: v },
          })
        }
      />
      <CampoTexto
        etiqueta="Plan de tratamiento"
        value={dp.planTratamiento}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            diagnosticoPlan: { ...dp, planTratamiento: v },
          })
        }
        multiline
      />
      <CampoTexto
        etiqueta="Objetivo general"
        value={dp.objetivoGeneral}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            diagnosticoPlan: { ...dp, objetivoGeneral: v },
          })
        }
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  subtitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E88E5',
    marginBottom: 10,
    marginTop: 4,
  },
});
