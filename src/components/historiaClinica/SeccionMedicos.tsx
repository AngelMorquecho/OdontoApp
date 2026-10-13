import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CampoTexto from '../campos/CampoTexto';
import CampoSiNo from '../campos/CampoSiNo';
import { HistoriaClinica } from '../../types/paciente';

interface Props {
  historiaClinica: HistoriaClinica;
  onChange: (nueva: HistoriaClinica) => void;
}

/** Sección de antecedentes médicos personales, gineco-obstétricos y odontológicos. */
export default function SeccionMedicos({ historiaClinica, onChange }: Props) {
  const {
    antecedentesMedicos: am,
    ginecoObstetricos: go,
    antecedentesOdontologicos: ao,
    signosVitales: sv,
    identificacion,
  } = historiaClinica;

  const condicionesMedicas: [keyof typeof am, string][] = [
    ['diabetes', 'Diabetes'],
    ['hipertension', 'Hipertensión'],
    ['asma', 'Asma'],
    ['epilepsia', 'Epilepsia'],
    ['coagulacion', 'Trastornos de coagulación'],
    ['renal', 'Enfermedad renal'],
    ['hepatica', 'Enfermedad hepática'],
    ['tiroidea', 'Enfermedad tiroidea'],
  ];

  return (
    <View>
      <Text style={styles.subtitulo}>Antecedentes médicos personales</Text>
      {condicionesMedicas.map(([campo, etiqueta]) => (
        <CampoSiNo
          key={campo}
          etiqueta={etiqueta}
          valor={am[campo] as 'si' | 'no'}
          onChange={(v) =>
            onChange({
              ...historiaClinica,
              antecedentesMedicos: { ...am, [campo]: v },
            })
          }
        />
      ))}

      <Text style={styles.subtitulo}>Alergias</Text>
      <CampoSiNo
        etiqueta="A medicamentos"
        valor={am.alergias.medicamentos}
        onChange={(v) =>
          onChange({
            ...historiaClinica,
            antecedentesMedicos: {
              ...am,
              alergias: { ...am.alergias, medicamentos: v },
            },
          })
        }
      />
      <CampoSiNo
        etiqueta="A alimentos"
        valor={am.alergias.alimentos}
        onChange={(v) =>
          onChange({
            ...historiaClinica,
            antecedentesMedicos: {
              ...am,
              alergias: { ...am.alergias, alimentos: v },
            },
          })
        }
      />
      <CampoSiNo
        etiqueta="Al látex"
        valor={am.alergias.latex}
        onChange={(v) =>
          onChange({
            ...historiaClinica,
            antecedentesMedicos: {
              ...am,
              alergias: { ...am.alergias, latex: v },
            },
          })
        }
      />
      <CampoTexto
        etiqueta="Especifique alergias"
        value={am.alergias.especifique}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            antecedentesMedicos: {
              ...am,
              alergias: { ...am.alergias, especifique: v },
            },
          })
        }
        multiline
      />
      <CampoTexto
        etiqueta="Medicamentos actuales"
        value={am.medicamentosActuales}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            antecedentesMedicos: { ...am, medicamentosActuales: v },
          })
        }
        multiline
      />
      <CampoTexto
        etiqueta="Médico tratante"
        value={am.medicoTratante}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            antecedentesMedicos: { ...am, medicoTratante: v },
          })
        }
      />

      {identificacion.sexo === 'F' && (
        <>
          <Text style={styles.subtitulo}>Antecedentes gineco-obstétricos</Text>
          <CampoSiNo
            etiqueta="¿Embarazada?"
            valor={go.embarazada}
            onChange={(v) =>
              onChange({
                ...historiaClinica,
                ginecoObstetricos: { ...go, embarazada: v },
              })
            }
          />
          {go.embarazada === 'si' && (
            <CampoTexto
              etiqueta="Semanas de gestación"
              value={go.semanas}
              onChangeText={(v) =>
                onChange({
                  ...historiaClinica,
                  ginecoObstetricos: { ...go, semanas: v },
                })
              }
              keyboardType="number-pad"
            />
          )}
          <CampoSiNo
            etiqueta="¿En lactancia?"
            valor={go.lactancia}
            onChange={(v) =>
              onChange({
                ...historiaClinica,
                ginecoObstetricos: { ...go, lactancia: v },
              })
            }
          />
          <CampoTexto
            etiqueta="Método anticonceptivo"
            value={go.metodoAnticonceptivo}
            onChangeText={(v) =>
              onChange({
                ...historiaClinica,
                ginecoObstetricos: { ...go, metodoAnticonceptivo: v },
              })
            }
          />
        </>
      )}

      <Text style={styles.subtitulo}>Antecedentes odontológicos</Text>
      <CampoTexto
        etiqueta="Última visita al dentista"
        value={ao.ultimaVisita}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            antecedentesOdontologicos: { ...ao, ultimaVisita: v },
          })
        }
      />
      <CampoTexto
        etiqueta="Tratamientos previos"
        value={ao.tratamientosPrevios}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            antecedentesOdontologicos: { ...ao, tratamientosPrevios: v },
          })
        }
        multiline
      />
      <CampoTexto
        etiqueta="Experiencia con anestesia"
        value={ao.experienciaAnestesia}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            antecedentesOdontologicos: { ...ao, experienciaAnestesia: v },
          })
        }
        multiline
      />

      <Text style={styles.subtitulo}>Signos vitales</Text>
      <CampoTexto
        etiqueta="Tensión arterial (TA)"
        value={sv.ta}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            signosVitales: { ...sv, ta: v },
          })
        }
        placeholder="120/80"
      />
      <CampoTexto
        etiqueta="Frecuencia cardiaca (FC)"
        value={sv.fc}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            signosVitales: { ...sv, fc: v },
          })
        }
        keyboardType="number-pad"
      />
      <CampoTexto
        etiqueta="Frecuencia respiratoria (FR)"
        value={sv.fr}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            signosVitales: { ...sv, fr: v },
          })
        }
        keyboardType="number-pad"
      />
      <CampoTexto
        etiqueta="Temperatura"
        value={sv.temperatura}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            signosVitales: { ...sv, temperatura: v },
          })
        }
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
