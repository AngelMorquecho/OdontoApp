import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CampoTexto from '../campos/CampoTexto';
import { HistoriaClinica } from '../../types/paciente';

interface Props {
  historiaClinica: HistoriaClinica;
  onChange: (nueva: HistoriaClinica) => void;
}

/** Sección de exploración clínica (extraoral/intraoral) y evaluación periodontal. */
export default function SeccionExploracion({ historiaClinica, onChange }: Props) {
  const { exploracionClinica: ec, evaluacionPeriodontal: ep } = historiaClinica;

  return (
    <View>
      <Text style={styles.subtitulo}>Exploración extraoral</Text>
      <CampoTexto
        etiqueta="Cabeza y cuello"
        value={ec.extraoral.cabezaCuello}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            exploracionClinica: {
              ...ec,
              extraoral: { ...ec.extraoral, cabezaCuello: v },
            },
          })
        }
        multiline
      />
      <CampoTexto
        etiqueta="ATM (articulación temporomandibular)"
        value={ec.extraoral.atm}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            exploracionClinica: {
              ...ec,
              extraoral: { ...ec.extraoral, atm: v },
            },
          })
        }
        multiline
      />
      <CampoTexto
        etiqueta="Ganglios"
        value={ec.extraoral.ganglios}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            exploracionClinica: {
              ...ec,
              extraoral: { ...ec.extraoral, ganglios: v },
            },
          })
        }
        multiline
      />

      <Text style={styles.subtitulo}>Exploración intraoral</Text>
      <CampoTexto
        etiqueta="Labios"
        value={ec.intraoral.labios}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            exploracionClinica: {
              ...ec,
              intraoral: { ...ec.intraoral, labios: v },
            },
          })
        }
      />
      <CampoTexto
        etiqueta="Encía"
        value={ec.intraoral.encia}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            exploracionClinica: {
              ...ec,
              intraoral: { ...ec.intraoral, encia: v },
            },
          })
        }
      />
      <CampoTexto
        etiqueta="Lengua"
        value={ec.intraoral.lengua}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            exploracionClinica: {
              ...ec,
              intraoral: { ...ec.intraoral, lengua: v },
            },
          })
        }
      />
      <CampoTexto
        etiqueta="Placa dentobacteriana"
        value={ec.intraoral.placa}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            exploracionClinica: {
              ...ec,
              intraoral: { ...ec.intraoral, placa: v },
            },
          })
        }
      />
      <CampoTexto
        etiqueta="Cálculo"
        value={ec.intraoral.calculo}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            exploracionClinica: {
              ...ec,
              intraoral: { ...ec.intraoral, calculo: v },
            },
          })
        }
      />
      <CampoTexto
        etiqueta="Relación oclusal"
        value={ec.intraoral.relacionOclusal}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            exploracionClinica: {
              ...ec,
              intraoral: { ...ec.intraoral, relacionOclusal: v },
            },
          })
        }
      />

      <Text style={styles.subtitulo}>Evaluación periodontal</Text>
      <CampoTexto
        etiqueta="Estado periodontal"
        value={ep.estadoPeriodontal}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            evaluacionPeriodontal: { ...ep, estadoPeriodontal: v },
          })
        }
      />
      <CampoTexto
        etiqueta="Hallazgos"
        value={ep.hallazgos}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            evaluacionPeriodontal: { ...ep, hallazgos: v },
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
