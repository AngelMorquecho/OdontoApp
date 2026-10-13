import { DatosConsultorio } from '../context/ConsultorioContext';
import { Paciente } from '../types/paciente';

export interface RespaldoDatos {
  version: 1;
  fechaExportacion: string;
  consultorio: DatosConsultorio;
  pacientes: Paciente[];
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esDatosConsultorio(valor: unknown): valor is DatosConsultorio {
  return (
    esObjeto(valor) &&
    typeof valor.nombreDoctor === 'string' &&
    typeof valor.cedula === 'string' &&
    typeof valor.direccion === 'string' &&
    typeof valor.telefono === 'string' &&
    typeof valor.nombreClinica === 'string'
  );
}

function esPaciente(valor: unknown): valor is Paciente {
  if (!esObjeto(valor)) return false;
  return (
    typeof valor.id === 'string' &&
    valor.id.trim().length > 0 &&
    typeof valor.nombre === 'string' &&
    typeof valor.edad === 'number' &&
    typeof valor.telefono === 'string' &&
    (valor.fechaNacimiento === undefined || typeof valor.fechaNacimiento === 'string') &&
    (valor.correo === undefined || typeof valor.correo === 'string') &&
    esObjeto(valor.odontograma) &&
    esObjeto(valor.historiaClinica) &&
    Array.isArray(valor.radiografias)
  );
}

export function crearRespaldoJson(
  pacientes: Paciente[],
  consultorio: DatosConsultorio,
): string {
  const respaldo: RespaldoDatos = {
    version: 1,
    fechaExportacion: new Date().toISOString(),
    consultorio,
    pacientes,
  };
  return JSON.stringify(respaldo, null, 2);
}

export function leerRespaldoJson(contenido: string): RespaldoDatos {
  let datos: unknown;
  try {
    datos = JSON.parse(contenido) as unknown;
  } catch {
    throw new Error('El archivo no contiene un JSON válido.');
  }

  if (
    !esObjeto(datos) ||
    datos.version !== 1 ||
    typeof datos.fechaExportacion !== 'string' ||
    !Array.isArray(datos.pacientes) ||
    !datos.pacientes.every(esPaciente) ||
    !esDatosConsultorio(datos.consultorio)
  ) {
    throw new Error(
      'El archivo no tiene el formato de respaldo de OdontoApp o contiene datos incompletos.',
    );
  }

  const ids = datos.pacientes.map((paciente) => paciente.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('El respaldo contiene identificadores de paciente duplicados.');
  }

  return datos as unknown as RespaldoDatos;
}
