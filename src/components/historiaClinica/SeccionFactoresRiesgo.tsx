import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CampoTexto from '../campos/CampoTexto';
import CampoSiNo from '../campos/CampoSiNo';
import CampoOpciones from '../campos/CampoOpciones';
import { HistoriaClinica } from '../../types/paciente';

interface Props {
  historiaClinica: HistoriaClinica;
  onChange: (nueva: HistoriaClinica) => void;
}

/** Sección de factores de riesgo (vivienda, hábitos) y antecedentes heredofamiliares. */
export default function SeccionFactoresRiesgo({ historiaClinica, onChange }: Props) {
  const { factoresRiesgo, antecedentesHeredofamiliares } = historiaClinica;

  return (
    <View>
      <Text style={styles.subtitulo}>Factores de riesgo</Text>
      <CampoTexto
        etiqueta="Tipo de vivienda"
        value={factoresRiesgo.tipoVivienda}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            factoresRiesgo: { ...factoresRiesgo, tipoVivienda: v },
          })
        }
      />
      <CampoTexto
        etiqueta="Zona"
        value={factoresRiesgo.zona}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            factoresRiesgo: { ...factoresRiesgo, zona: v },
          })
        }
        placeholder="Urbana / rural"
      />
      <CampoTexto
        etiqueta="Servicios con los que cuenta"
        value={factoresRiesgo.servicios}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            factoresRiesgo: { ...factoresRiesgo, servicios: v },
          })
        }
        placeholder="Agua, luz, drenaje..."
      />

      <CampoSiNo
        etiqueta="Tabaquismo"
        valor={factoresRiesgo.tabaquismo.consume}
        onChange={(v) =>
          onChange({
            ...historiaClinica,
            factoresRiesgo: {
              ...factoresRiesgo,
              tabaquismo: { ...factoresRiesgo.tabaquismo, consume: v },
            },
          })
        }
      />
      {factoresRiesgo.tabaquismo.consume === 'si' && (
        <>
          <CampoTexto
            etiqueta="Frecuencia (tabaquismo)"
            value={factoresRiesgo.tabaquismo.frecuencia}
            onChangeText={(v) =>
              onChange({
                ...historiaClinica,
                factoresRiesgo: {
                  ...factoresRiesgo,
                  tabaquismo: { ...factoresRiesgo.tabaquismo, frecuencia: v },
                },
              })
            }
          />
          <CampoTexto
            etiqueta="Tiempo de consumo (tabaquismo)"
            value={factoresRiesgo.tabaquismo.tiempo}
            onChangeText={(v) =>
              onChange({
                ...historiaClinica,
                factoresRiesgo: {
                  ...factoresRiesgo,
                  tabaquismo: { ...factoresRiesgo.tabaquismo, tiempo: v },
                },
              })
            }
          />
        </>
      )}

      <CampoSiNo
        etiqueta="Alcohol"
        valor={factoresRiesgo.alcohol.consume}
        onChange={(v) =>
          onChange({
            ...historiaClinica,
            factoresRiesgo: {
              ...factoresRiesgo,
              alcohol: { ...factoresRiesgo.alcohol, consume: v },
            },
          })
        }
      />
      {factoresRiesgo.alcohol.consume === 'si' && (
        <>
          <CampoTexto
            etiqueta="Frecuencia (alcohol)"
            value={factoresRiesgo.alcohol.frecuencia}
            onChangeText={(v) =>
              onChange({
                ...historiaClinica,
                factoresRiesgo: {
                  ...factoresRiesgo,
                  alcohol: { ...factoresRiesgo.alcohol, frecuencia: v },
                },
              })
            }
          />
          <CampoTexto
            etiqueta="Tiempo de consumo (alcohol)"
            value={factoresRiesgo.alcohol.tiempo}
            onChangeText={(v) =>
              onChange({
                ...historiaClinica,
                factoresRiesgo: {
                  ...factoresRiesgo,
                  alcohol: { ...factoresRiesgo.alcohol, tiempo: v },
                },
              })
            }
          />
        </>
      )}

      <CampoSiNo
        etiqueta="Drogas"
        valor={factoresRiesgo.drogas.consume}
        onChange={(v) =>
          onChange({
            ...historiaClinica,
            factoresRiesgo: {
              ...factoresRiesgo,
              drogas: { ...factoresRiesgo.drogas, consume: v },
            },
          })
        }
      />
      {factoresRiesgo.drogas.consume === 'si' && (
        <>
          <CampoTexto
            etiqueta="Frecuencia (drogas)"
            value={factoresRiesgo.drogas.frecuencia}
            onChangeText={(v) =>
              onChange({
                ...historiaClinica,
                factoresRiesgo: {
                  ...factoresRiesgo,
                  drogas: { ...factoresRiesgo.drogas, frecuencia: v },
                },
              })
            }
          />
          <CampoTexto
            etiqueta="Tiempo de consumo (drogas)"
            value={factoresRiesgo.drogas.tiempo}
            onChangeText={(v) =>
              onChange({
                ...historiaClinica,
                factoresRiesgo: {
                  ...factoresRiesgo,
                  drogas: { ...factoresRiesgo.drogas, tiempo: v },
                },
              })
            }
          />
        </>
      )}

      <CampoTexto
        etiqueta="Frecuencia de higiene oral"
        value={factoresRiesgo.higieneOral.frecuencia}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            factoresRiesgo: {
              ...factoresRiesgo,
              higieneOral: { ...factoresRiesgo.higieneOral, frecuencia: v },
            },
          })
        }
        placeholder="Ej. 2 veces al día"
      />
      <CampoOpciones
        etiqueta="Calidad de higiene oral"
        valor={factoresRiesgo.higieneOral.calidad}
        opciones={[
          { valor: 'buena', etiqueta: 'Buena' },
          { valor: 'regular', etiqueta: 'Regular' },
          { valor: 'mala', etiqueta: 'Mala' },
        ]}
        onChange={(v) =>
          onChange({
            ...historiaClinica,
            factoresRiesgo: {
              ...factoresRiesgo,
              higieneOral: { ...factoresRiesgo.higieneOral, calidad: v },
            },
          })
        }
      />

      <Text style={styles.subtitulo}>Antecedentes heredofamiliares</Text>
      <CampoSiNo
        etiqueta="Diabetes"
        valor={antecedentesHeredofamiliares.diabetes}
        onChange={(v) =>
          onChange({
            ...historiaClinica,
            antecedentesHeredofamiliares: {
              ...antecedentesHeredofamiliares,
              diabetes: v,
            },
          })
        }
      />
      <CampoSiNo
        etiqueta="Hipertensión"
        valor={antecedentesHeredofamiliares.hipertension}
        onChange={(v) =>
          onChange({
            ...historiaClinica,
            antecedentesHeredofamiliares: {
              ...antecedentesHeredofamiliares,
              hipertension: v,
            },
          })
        }
      />
      <CampoSiNo
        etiqueta="Cardiopatías"
        valor={antecedentesHeredofamiliares.cardiopatias}
        onChange={(v) =>
          onChange({
            ...historiaClinica,
            antecedentesHeredofamiliares: {
              ...antecedentesHeredofamiliares,
              cardiopatias: v,
            },
          })
        }
      />
      <CampoSiNo
        etiqueta="Cáncer"
        valor={antecedentesHeredofamiliares.cancer}
        onChange={(v) =>
          onChange({
            ...historiaClinica,
            antecedentesHeredofamiliares: {
              ...antecedentesHeredofamiliares,
              cancer: v,
            },
          })
        }
      />
      <CampoTexto
        etiqueta="Especifique"
        value={antecedentesHeredofamiliares.especifique}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            antecedentesHeredofamiliares: {
              ...antecedentesHeredofamiliares,
              especifique: v,
            },
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
