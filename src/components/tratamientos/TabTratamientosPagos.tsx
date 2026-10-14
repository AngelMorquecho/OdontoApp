import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import type { AbonoTratamiento, TratamientoPaciente } from '../../types';
import type { Paciente } from '../../types/paciente';
import type { DatosConsultorio } from '../../context/ConsultorioContext';
import { usePacientes } from '../../context/PacientesContext';
import { borderRadius, colors, shadows } from '../../constants/theme';
import { imprimirComprobanteAbono } from '../../services/comprobanteAbonoService';

interface Props {
  paciente: Paciente;
  consultorio: DatosConsultorio;
  navigation: NativeStackNavigationProp<RootStackParamList, 'DetallePaciente'>;
}

function moneda(cantidad: number): string {
  return cantidad.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
}

function fechaLegible(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  if (!anio || !mes || !dia) return fecha;
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function TabTratamientosPagos({
  paciente,
  consultorio,
  navigation,
}: Props) {
  const { getTratamientosPaciente } = usePacientes();
  const tratamientos = getTratamientosPaciente(paciente.id);
  const activos = tratamientos.filter((item) => item.estado === 'en_proceso');
  const historial = tratamientos.filter((item) => item.estado === 'completado');

  const imprimirRecibo = async (abono: AbonoTratamiento, tratamiento: TratamientoPaciente) => {
    try {
      await imprimirComprobanteAbono(abono, tratamiento, paciente, consultorio);
    } catch (error) {
      Alert.alert(
        'No se pudo generar el comprobante',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    }
  };

  const renderizarLista = (items: TratamientoPaciente[], vacio: string) => {
    if (items.length === 0) {
      return <Text style={styles.vacio}>{vacio}</Text>;
    }
    return items.map((tratamiento) => {
      const pagado = tratamiento.abonos.reduce((total, abono) => total + abono.monto, 0);
      const saldo = Math.max(0, tratamiento.costoTotal - pagado);
      const liquidado = saldo <= 0.005;
      const progreso = Math.min(100, (pagado / tratamiento.costoTotal) * 100);
      return (
        <View key={tratamiento.id} style={styles.tarjetaTratamiento}>
          <View style={styles.filaTitulo}>
            <View style={styles.contenidoTitulo}>
              <Text style={styles.nombreTratamiento}>{tratamiento.nombre}</Text>
              <Text style={styles.descripcion}>
                {tratamiento.descripcion || 'Sin notas clínicas adicionales.'}
              </Text>
            </View>
            <View style={[
              styles.badgePago,
              liquidado ? styles.badgeLiquidado : styles.badgePendiente,
            ]}>
              <Text style={[
                styles.textoBadgePago,
                liquidado ? styles.textoLiquidado : styles.textoPendiente,
              ]}>
                {liquidado ? 'Liquidado' : 'Saldo pendiente'}
              </Text>
            </View>
          </View>

          <View style={styles.resumenFinanciero}>
            <DatoFinanciero etiqueta="Costo total" valor={moneda(tratamiento.costoTotal)} />
            <DatoFinanciero etiqueta="Abonos" valor={moneda(pagado)} />
            <DatoFinanciero
              etiqueta="Saldo"
              valor={moneda(saldo)}
              destacado={!liquidado}
            />
          </View>

          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`Pago completado ${Math.round(progreso)} por ciento`}
            accessibilityValue={{ min: 0, max: 100, now: Math.round(progreso) }}
            style={styles.fondoProgreso}
          >
            <View style={[styles.progreso, { width: `${progreso}%` }]} />
          </View>
          <Text style={styles.textoProgreso}>{Math.round(progreso)}% pagado</Text>

          {tratamiento.abonos.length > 0 && (
            <View style={styles.listaAbonos}>
              <Text style={styles.tituloAbonos}>Historial de abonos</Text>
              {tratamiento.abonos
                .slice()
                .sort((a, b) => b.fecha.localeCompare(a.fecha))
                .map((abono) => (
                  <View key={abono.id} style={styles.filaAbono}>
                    <View style={styles.detalleAbono}>
                      <Text style={styles.montoAbono}>{moneda(abono.monto)}</Text>
                      <Text style={styles.metaAbono}>
                        {fechaLegible(abono.fecha)} · {nombreMetodo(abono.metodoPago)}
                        {abono.concepto ? ` · ${abono.concepto}` : ''}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Imprimir o compartir comprobante del abono"
                      onPress={() => void imprimirRecibo(abono, tratamiento)}
                      style={({ pressed }) => [
                        styles.botonComprobante,
                        pressed && styles.presionado,
                      ]}
                    >
                      <Ionicons name="receipt-outline" size={17} color={colors.primary} />
                      <Text style={styles.textoComprobante}>Recibo</Text>
                    </Pressable>
                  </View>
                ))}
            </View>
          )}

          {!liquidado && (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate('RegistrarAbono', {
                  pacienteId: paciente.id,
                  tratamientoId: tratamiento.id,
                })
              }
              style={({ pressed }) => [
                styles.botonAbonar,
                pressed && styles.presionado,
              ]}
            >
              <Ionicons name="wallet-outline" size={17} color={colors.primary} />
              <Text style={styles.textoBotonAbonar}>Registrar abono</Text>
            </Pressable>
          )}
        </View>
      );
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.contenido}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('NuevoTratamiento', { pacienteId: paciente.id })}
        style={({ pressed }) => [
          styles.botonNuevo,
          pressed && styles.presionado,
        ]}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.surface} />
        <Text style={styles.textoBotonNuevo}>Nuevo tratamiento</Text>
      </Pressable>

      <Seccion titulo="Tratamientos activos" icono="medical-outline">
        {renderizarLista(activos, 'Este paciente no tiene tratamientos en proceso.')}
      </Seccion>
      <Seccion titulo="Historial de tratamientos" icono="time-outline">
        {renderizarLista(historial, 'Los tratamientos completados aparecerán aquí.')}
      </Seccion>
    </ScrollView>
  );
}

function DatoFinanciero({
  etiqueta,
  valor,
  destacado = false,
}: {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <View style={styles.datoFinanciero}>
      <Text style={styles.etiquetaFinanciera}>{etiqueta}</Text>
      <Text style={[styles.valorFinanciero, destacado && styles.valorSaldo]}>{valor}</Text>
    </View>
  );
}

function Seccion({
  titulo,
  icono,
  children,
}: {
  titulo: string;
  icono: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.seccion}>
      <View style={styles.encabezadoSeccion}>
        <Ionicons name={icono} size={19} color={colors.primary} />
        <Text style={styles.tituloSeccion}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

function nombreMetodo(metodo: AbonoTratamiento['metodoPago']): string {
  if (metodo === 'efectivo') return 'Efectivo';
  if (metodo === 'tarjeta') return 'Tarjeta';
  return 'Transferencia';
}

const styles = StyleSheet.create({
  contenido: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 100 },
  botonNuevo: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  textoBotonNuevo: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  seccion: { marginBottom: 20 },
  encabezadoSeccion: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tituloSeccion: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  vacio: {
    padding: 16,
    borderRadius: borderRadius.md,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    fontSize: 13,
    textAlign: 'center',
  },
  tarjetaTratamiento: {
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  filaTitulo: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  contenidoTitulo: { flex: 1, minWidth: 0 },
  nombreTratamiento: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  descripcion: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  badgePago: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: borderRadius.full },
  badgeLiquidado: { backgroundColor: '#DCFCE7' },
  badgePendiente: { backgroundColor: '#FEF3C7' },
  textoBadgePago: { fontSize: 10, fontWeight: '700' },
  textoLiquidado: { color: '#15803D' },
  textoPendiente: { color: '#B45309' },
  resumenFinanciero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  datoFinanciero: { flex: 1, minWidth: 0 },
  etiquetaFinanciera: { color: colors.textSecondary, fontSize: 10 },
  valorFinanciero: { marginTop: 4, color: colors.textPrimary, fontSize: 12, fontWeight: '700' },
  valorSaldo: { color: '#B45309' },
  fondoProgreso: { height: 7, overflow: 'hidden', marginTop: 14, borderRadius: 6, backgroundColor: '#E2E8F0' },
  progreso: { height: '100%', borderRadius: 6, backgroundColor: '#16A34A' },
  textoProgreso: { marginTop: 5, color: colors.textSecondary, fontSize: 10, textAlign: 'right' },
  listaAbonos: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  tituloAbonos: { marginBottom: 8, color: colors.textPrimary, fontSize: 12, fontWeight: '700' },
  filaAbono: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  detalleAbono: { flex: 1, minWidth: 0 },
  montoAbono: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  metaAbono: { marginTop: 3, color: colors.textSecondary, fontSize: 10, lineHeight: 14 },
  botonComprobante: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
  },
  textoComprobante: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  botonAbonar: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  textoBotonAbonar: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  presionado: { opacity: 0.7 },
});
