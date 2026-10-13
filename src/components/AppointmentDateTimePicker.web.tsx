import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { borderRadius, colors, shadows } from '../constants/theme';

interface Props {
  visible: boolean;
  mode: 'date' | 'time';
  value: Date;
  maximumDate?: Date;
  onChange: (value: Date) => void;
  onClose: () => void;
}

const DIAS_SEMANA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

export default function AppointmentDateTimePicker({
  visible,
  mode,
  value,
  maximumDate,
  onChange,
  onClose,
}: Props) {
  const [mostrarAnios, setMostrarAnios] = useState(false);
  const [mesVisible, setMesVisible] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );
  const [fechaBase, setFechaBase] = useState(value);
  const [hora, setHora] = useState(value.getHours());
  const [minuto, setMinuto] = useState(value.getMinutes());
  const primerDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1).getDay();
  const diasEnMes = new Date(
    mesVisible.getFullYear(),
    mesVisible.getMonth() + 1,
    0,
  ).getDate();
  const anioActual = new Date().getFullYear();
  const anioMinimo = anioActual - 120;
  const anioMaximo = maximumDate?.getFullYear() ?? anioActual + 10;

  const moverMes = (cantidad: number) => {
    setMesVisible(
      (actual) => new Date(actual.getFullYear(), actual.getMonth() + cantidad, 1),
    );
  };

  const seleccionarDia = (dia: number) => {
    setFechaBase(
      (actual) =>
        new Date(
          mesVisible.getFullYear(),
          mesVisible.getMonth(),
          dia,
          actual.getHours(),
          actual.getMinutes(),
        ),
    );
  };

  const seleccionarAnio = (anio: number) => {
    const mesMaximo =
      maximumDate && anio === maximumDate.getFullYear()
        ? maximumDate.getMonth()
        : 11;
    const mes = Math.min(mesVisible.getMonth(), mesMaximo);
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    const dia = Math.min(fechaBase.getDate(), ultimoDia);
    const fecha = new Date(
      anio,
      mes,
      dia,
      fechaBase.getHours(),
      fechaBase.getMinutes(),
    );
    setMesVisible(new Date(anio, mes, 1));
    setFechaBase(fecha);
    setMostrarAnios(false);
  };

  const modificarTiempo = (unidad: 'hora' | 'minuto', cantidad: number) => {
    const minutosTotales =
      (hora * 60 + minuto + (unidad === 'hora' ? cantidad * 60 : cantidad) + 1440) %
      1440;
    setHora(Math.floor(minutosTotales / 60));
    setMinuto(minutosTotales % 60);
  };

  const confirmar = () => {
    if (mode === 'date') {
      onChange(fechaBase);
    } else {
      const nuevaHora = new Date(value);
      nuevaHora.setHours(hora, minuto, 0, 0);
      onChange(nuevaHora);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <View style={styles.tarjeta}>
          <View style={styles.encabezado}>
            <Text style={styles.titulo}>
              {mode === 'date' ? 'Seleccionar fecha' : 'Seleccionar hora'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar selector"
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.cerrar, pressed && styles.presionado]}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {mode === 'date' ? (
            <>
              {mostrarAnios ? (
                <ScrollView style={styles.selectorAnios}>
                  <View style={styles.listaAnios}>
                    {Array.from(
                      { length: anioMaximo - anioMinimo + 1 },
                      (_, indice) => anioMaximo - indice,
                    ).map((anio) => (
                      <Pressable
                        key={anio}
                        accessibilityRole="button"
                        accessibilityLabel={`Seleccionar año ${anio}`}
                        accessibilityState={{
                          selected: anio === mesVisible.getFullYear(),
                        }}
                        onPress={() => seleccionarAnio(anio)}
                        style={({ pressed }) => [
                          styles.botonAnio,
                          anio === mesVisible.getFullYear() && styles.anioSeleccionado,
                          pressed && styles.presionado,
                        ]}
                      >
                        <Text
                          style={[
                            styles.textoAnio,
                            anio === mesVisible.getFullYear() &&
                              styles.textoAnioSeleccionado,
                          ]}
                        >
                          {anio}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              ) : (
                <>
                  <View style={styles.cabeceraCalendario}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Mes anterior"
                      onPress={() => moverMes(-1)}
                      style={({ pressed }) => [styles.botonMes, pressed && styles.presionado]}
                    >
                      <Ionicons name="chevron-back" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Elegir año"
                      onPress={() => setMostrarAnios(true)}
                      style={({ pressed }) => [
                        styles.botonNombreMes,
                        pressed && styles.presionado,
                      ]}
                    >
                      <Text style={styles.nombreMes}>
                        {mesVisible.toLocaleDateString('es-MX', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Mes siguiente"
                      onPress={() => moverMes(1)}
                      style={({ pressed }) => [styles.botonMes, pressed && styles.presionado]}
                    >
                      <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                    </Pressable>
                  </View>
                  <View style={styles.calendario}>
                    {DIAS_SEMANA.map((dia, indice) => (
                      <Text key={`${dia}-${indice}`} style={styles.diaSemana}>
                        {dia}
                      </Text>
                    ))}
                    {Array.from({ length: primerDia }, (_, indice) => (
                      <View key={`vacio-${indice}`} style={styles.celdaDia} />
                    ))}
                    {Array.from({ length: diasEnMes }, (_, indice) => {
                      const dia = indice + 1;
                      const fechaDia = new Date(
                        mesVisible.getFullYear(),
                        mesVisible.getMonth(),
                        dia,
                      );
                      const deshabilitado =
                        maximumDate !== undefined &&
                        fechaDia > new Date(
                          maximumDate.getFullYear(),
                          maximumDate.getMonth(),
                          maximumDate.getDate(),
                        );
                      const seleccionado =
                        fechaBase.getFullYear() === mesVisible.getFullYear() &&
                        fechaBase.getMonth() === mesVisible.getMonth() &&
                        fechaBase.getDate() === dia;
                      return (
                        <Pressable
                          key={dia}
                          accessibilityRole="button"
                          accessibilityLabel={`${dia} de ${mesVisible.toLocaleDateString('es-MX', { month: 'long' })}`}
                          accessibilityState={{ selected: seleccionado }}
                          disabled={deshabilitado}
                          onPress={() => seleccionarDia(dia)}
                          style={({ pressed }) => [
                            styles.celdaDia,
                            seleccionado && styles.diaSeleccionado,
                            deshabilitado && styles.diaDeshabilitado,
                            pressed && styles.presionado,
                          ]}
                        >
                          <Text
                            style={[
                              styles.numeroDia,
                              seleccionado && styles.numeroDiaSeleccionado,
                              deshabilitado && styles.numeroDiaDeshabilitado,
                            ]}
                          >
                            {dia}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}
              <Text style={styles.resumenSeleccion}>
                {fechaBase.toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </>
          ) : (
            <View style={styles.selectorHora}>
              <SelectorNumero
                etiqueta="Hora"
                valor={hora}
                onMenos={() => modificarTiempo('hora', -1)}
                onMas={() => modificarTiempo('hora', 1)}
              />
              <Text style={styles.separadorHora}>:</Text>
              <SelectorNumero
                etiqueta="Minuto"
                valor={minuto}
                onMenos={() => modificarTiempo('minuto', -5)}
                onMas={() => modificarTiempo('minuto', 5)}
              />
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={confirmar}
            style={({ pressed }) => [
              styles.botonConfirmar,
              pressed && styles.presionado,
            ]}
          >
            <Text style={styles.textoConfirmar}>Confirmar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function SelectorNumero({
  etiqueta,
  valor,
  onMenos,
  onMas,
}: {
  etiqueta: string;
  valor: number;
  onMenos: () => void;
  onMas: () => void;
}) {
  return (
    <View style={styles.columnaTiempo}>
      <Text style={styles.etiquetaTiempo}>{etiqueta}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Aumentar ${etiqueta.toLowerCase()}`}
        onPress={onMas}
        style={({ pressed }) => [styles.botonAjuste, pressed && styles.presionado]}
      >
        <Ionicons name="chevron-up" size={22} color={colors.primary} />
      </Pressable>
      <Text style={styles.valorTiempo}>{String(valor).padStart(2, '0')}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Disminuir ${etiqueta.toLowerCase()}`}
        onPress={onMenos}
        style={({ pressed }) => [styles.botonAjuste, pressed && styles.presionado]}
      >
        <Ionicons name="chevron-down" size={22} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  tarjeta: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  cerrar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
  },
  cabeceraCalendario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  botonNombreMes: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  botonMes: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  nombreMes: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  selectorAnios: {
    maxHeight: 280,
  },
  listaAnios: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  botonAnio: {
    width: '25%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  anioSeleccionado: {
    backgroundColor: colors.primary,
  },
  textoAnio: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  textoAnioSeleccionado: {
    color: colors.surface,
    fontWeight: '700',
  },
  calendario: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  diaSemana: {
    width: '14.2857%',
    paddingVertical: 8,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  celdaDia: {
    width: '14.2857%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  diaSeleccionado: {
    backgroundColor: colors.primary,
  },
  diaDeshabilitado: {
    opacity: 0.35,
  },
  numeroDia: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  numeroDiaSeleccionado: {
    color: colors.surface,
    fontWeight: '700',
  },
  numeroDiaDeshabilitado: {
    color: colors.textSecondary,
  },
  resumenSeleccion: {
    marginTop: 12,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  selectorHora: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingVertical: 14,
  },
  columnaTiempo: {
    alignItems: 'center',
    gap: 8,
  },
  etiquetaTiempo: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  botonAjuste: {
    width: 48,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
  },
  valorTiempo: {
    minWidth: 68,
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  separadorHora: {
    marginTop: 24,
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '700',
  },
  botonConfirmar: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  textoConfirmar: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  presionado: {
    opacity: 0.7,
  },
});
