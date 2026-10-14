import AsyncStorage from '@react-native-async-storage/async-storage';
import { CuentaDoctor, EstadoSuscripcion } from '../types';
import { CLAVES_DATOS, crearDatosPrueba } from '../utils/seedData';

export type EstadoDoctor = 'activo' | 'inactivo' | 'vencido';
export type NuevaCuentaDoctor = Omit<CuentaDoctor, 'id' | 'fechaAlta'>;

function fechaLocal(fecha: Date): string {
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, '0'),
    String(fecha.getDate()).padStart(2, '0'),
  ].join('-');
}

function validarCuentas(valor: unknown): CuentaDoctor[] {
  if (!Array.isArray(valor)) {
    throw new Error('El registro de doctores guardado no tiene un formato válido.');
  }
  return valor.map((item) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('id' in item) ||
      typeof item.id !== 'string' ||
      !('nombre' in item) ||
      typeof item.nombre !== 'string' ||
      !('especialidad' in item) ||
      typeof item.especialidad !== 'string' ||
      !('cedula' in item) ||
      typeof item.cedula !== 'string' ||
      !('email' in item) ||
      typeof item.email !== 'string' ||
      !('passwordTemporal' in item) ||
      typeof item.passwordTemporal !== 'string' ||
      !('suscripcion' in item) ||
      (item.suscripcion !== 'activa' && item.suscripcion !== 'inactiva') ||
      !('fechaVencimiento' in item) ||
      typeof item.fechaVencimiento !== 'string' ||
      !('fechaAlta' in item) ||
      typeof item.fechaAlta !== 'string' ||
      ('limitePacientes' in item &&
        (typeof item.limitePacientes !== 'number' ||
          !Number.isSafeInteger(item.limitePacientes) ||
          item.limitePacientes < 1))
    ) {
      throw new Error('El registro de doctores contiene una cuenta no válida.');
    }
    return item as CuentaDoctor;
  });
}

export async function listarDoctores(): Promise<CuentaDoctor[]> {
  const guardado = await AsyncStorage.getItem(CLAVES_DATOS.doctores);
  if (!guardado) {
    const iniciales = crearDatosPrueba().doctores;
    await AsyncStorage.setItem(CLAVES_DATOS.doctores, JSON.stringify(iniciales));
    return iniciales;
  }
  return validarCuentas(JSON.parse(guardado) as unknown);
}

export function obtenerEstadoDoctor(doctor: CuentaDoctor, hoy = new Date()): EstadoDoctor {
  if (doctor.suscripcion === 'inactiva') return 'inactivo';
  const fechaVencimiento = new Date(`${doctor.fechaVencimiento}T23:59:59`);
  return Number.isNaN(fechaVencimiento.getTime()) || fechaVencimiento < hoy
    ? 'vencido'
    : 'activo';
}

export async function registrarDoctor(
  nuevaCuenta: NuevaCuentaDoctor,
): Promise<CuentaDoctor> {
  const doctores = await listarDoctores();
  const emailNormalizado = nuevaCuenta.email.trim().toLowerCase();
  if (doctores.some((doctor) => doctor.email.toLowerCase() === emailNormalizado)) {
    throw new Error('Ya existe una cuenta con ese correo electrónico.');
  }
  const ahora = new Date();
  const doctor: CuentaDoctor = {
    ...nuevaCuenta,
    id: `doctor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: emailNormalizado,
    fechaAlta: fechaLocal(ahora),
  };
  await AsyncStorage.setItem(
    CLAVES_DATOS.doctores,
    JSON.stringify([doctor, ...doctores]),
  );
  return doctor;
}

export async function actualizarDoctor(
  doctorId: string,
  cambios: Partial<Pick<CuentaDoctor, 'suscripcion' | 'fechaVencimiento'>>,
): Promise<void> {
  const doctores = await listarDoctores();
  if (!doctores.some((doctor) => doctor.id === doctorId)) {
    throw new Error('No se encontró la cuenta del doctor.');
  }
  await AsyncStorage.setItem(
    CLAVES_DATOS.doctores,
    JSON.stringify(doctores.map((doctor) =>
      doctor.id === doctorId ? { ...doctor, ...cambios } : doctor,
    )),
  );
}

export async function autenticarDoctor(
  email: string,
  password: string,
): Promise<CuentaDoctor | null> {
  const doctores = await listarDoctores();
  const doctor = doctores.find(
    (cuenta) =>
      cuenta.email.toLowerCase() === email.trim().toLowerCase() &&
      cuenta.passwordTemporal === password,
  );
  return doctor && obtenerEstadoDoctor(doctor) === 'activo' ? doctor : null;
}

export function validarEstadoSuscripcion(valor: unknown): valor is EstadoSuscripcion {
  return valor === 'activa' || valor === 'inactiva';
}
