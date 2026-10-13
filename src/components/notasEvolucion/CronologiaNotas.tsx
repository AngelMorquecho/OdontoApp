import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { NotaEvolucion } from '../../types/paciente';
import { borderRadius, colors, shadows } from '../../constants/theme';

interface Props {
  notas: NotaEvolucion[];
}

const COLOR_PRONOSTICO: Record<NotaEvolucion['pronostico'], string> = {
  Favorable: colors.success,
  Reservado: '#EF6C00',
  Desfavorable: colors.danger,
};

function etiquetasEstudios(estudios: NotaEvolucion['estudios']): string {
  const activos: string[] = [];
  if (estudios.rx) activos.push('Rx');
  if (estudios.fotos) activos.push('Fotos');
  if (estudios.escaneo) activos.push('Escaneo');
  if (estudios.cbct) activos.push('CBCT');
  return activos.length > 0 ? activos.join(' · ') : 'Ninguno';
}

/** Lista cronológica (más reciente primero) de notas de evolución clínica. */
export default function CronologiaNotas({ notas }: Props) {
  const notasOrdenadas = [...notas].sort((a, b) =>
    `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`),
  );

  if (notasOrdenadas.length === 0) {
    return (
      <View style={styles.vacio}>
        <Text style={styles.vacioTexto}>
          Aún no hay notas de evolución registradas para este paciente.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notasOrdenadas}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.lista}
      renderItem={({ item }) => (
        <View style={styles.tarjeta}>
          <View style={styles.encabezado}>
            <Text style={styles.fecha}>
              {item.fecha} · {item.hora}
            </Text>
            <Text
              style={[
                styles.pronostico,
                { color: COLOR_PRONOSTICO[item.pronostico] },
              ]}
            >
              {item.pronostico}
            </Text>
          </View>
          <Text style={styles.region}>OD / Región: {item.regionOD}</Text>
          <Text style={styles.texto}>{item.evolucionProcedimiento}</Text>

          {!!item.dx && <Text style={styles.detalle}>Dx: {item.dx}</Text>}
          {!!item.plan && <Text style={styles.detalle}>Plan: {item.plan}</Text>}
          <Text style={styles.detalle}>
            Anestesia: {item.anestesia === 'si' ? 'Sí' : 'No'}
          </Text>
          <Text style={styles.detalle}>
            Estudios: {etiquetasEstudios(item.estudios)}
          </Text>
          {!!item.receta && <Text style={styles.detalle}>Receta: {item.receta}</Text>}
          {!!item.indicaciones && (
            <Text style={styles.detalle}>Indicaciones: {item.indicaciones}</Text>
          )}
          {!!item.proximaCita && (
            <Text style={styles.proximaCita}>Próxima cita: {item.proximaCita}</Text>
          )}
          {!!item.tratante && (
            <Text style={styles.tratante}>Tratante: {item.tratante}</Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: {
    padding: 16,
    paddingBottom: 32,
  },
  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  vacioTexto: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 15,
  },
  tarjeta: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
    ...shadows.sm,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fecha: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pronostico: {
    fontSize: 13,
    fontWeight: '700',
  },
  region: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  texto: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  detalle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  proximaCita: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 6,
  },
  tratante: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
