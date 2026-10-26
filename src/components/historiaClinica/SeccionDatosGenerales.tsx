import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CampoTexto from '../campos/CampoTexto';
import CampoOpciones from '../campos/CampoOpciones';
import { HistoriaClinica } from '../../types/paciente';
import { colors } from '../../constants/theme';

interface Props {
  historiaClinica: HistoriaClinica;
  onChange: (nueva: HistoriaClinica) => void;
  fechaNacimientoPaciente?: string; // 👈 Agregamos la fecha que viene de la tabla pacientes
}

/** Sección de Identificación del paciente. */
export default function SeccionDatosGenerales({
  historiaClinica,
  onChange,
  fechaNacimientoPaciente,
}: Props) {
  const { identificacion } = historiaClinica;

  // Usa la fecha grabada en historias_clinicas; si está vacía, toma la fecha_nacimiento de la tabla pacientes
  const fechaNacimientoEfectiva =
    identificacion.fechaNacimiento || fechaNacimientoPaciente || '';

  return (
    <View>
      <Text style={styles.subtitulo}>Identificación</Text>
      <CampoTexto
        etiqueta="Fecha de nacimiento"
        value={fechaNacimientoEfectiva}
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
        keyboardType="numeric"
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
    color: colors.primary,
    marginBottom: 10,
    marginTop: 4,
  },
});