import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CampoTexto from '../campos/CampoTexto';
import CampoOpciones from '../campos/CampoOpciones';
import { HistoriaClinica } from '../../types/paciente';

interface Props {
  historiaClinica: HistoriaClinica;
  onChange: (nueva: HistoriaClinica) => void;
}

/** Sección de Identificación del paciente. */
export default function SeccionDatosGenerales({ historiaClinica, onChange }: Props) {
  const { identificacion } = historiaClinica;

  return (
    <View>
      <Text style={styles.subtitulo}>Identificación</Text>
      <CampoTexto
        etiqueta="Fecha de nacimiento (AAAA-MM-DD)"
        value={identificacion.fechaNacimiento}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            identificacion: { ...identificacion, fechaNacimiento: v },
          })
        }
        placeholder="1990-05-20"
      />
      <CampoOpciones
        etiqueta="Sexo"
        valor={identificacion.sexo}
        opciones={[
          { valor: 'M', etiqueta: 'Masculino' },
          { valor: 'F', etiqueta: 'Femenino' },
        ]}
        onChange={(v) =>
          onChange({
            ...historiaClinica,
            identificacion: { ...identificacion, sexo: v },
          })
        }
      />
      <CampoTexto
        etiqueta="Estado civil"
        value={identificacion.estadoCivil}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            identificacion: { ...identificacion, estadoCivil: v },
          })
        }
      />
      <CampoTexto
        etiqueta="Domicilio"
        value={identificacion.domicilio}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            identificacion: { ...identificacion, domicilio: v },
          })
        }
      />
      <CampoTexto
        etiqueta="Colonia"
        value={identificacion.colonia}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            identificacion: { ...identificacion, colonia: v },
          })
        }
      />
      <CampoTexto
        etiqueta="Código postal"
        value={identificacion.cp}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            identificacion: { ...identificacion, cp: v },
          })
        }
        keyboardType="number-pad"
      />
      <CampoTexto
        etiqueta="Ciudad"
        value={identificacion.ciudad}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            identificacion: { ...identificacion, ciudad: v },
          })
        }
      />
      <CampoTexto
        etiqueta="Ocupación"
        value={identificacion.ocupacion}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            identificacion: { ...identificacion, ocupacion: v },
          })
        }
      />
      <CampoTexto
        etiqueta="Escolaridad"
        value={identificacion.escolaridad}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            identificacion: { ...identificacion, escolaridad: v },
          })
        }
      />
      <CampoTexto
        etiqueta="Lugar de residencia"
        value={identificacion.lugarResidencia}
        onChangeText={(v) =>
          onChange({
            ...historiaClinica,
            identificacion: { ...identificacion, lugarResidencia: v },
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
