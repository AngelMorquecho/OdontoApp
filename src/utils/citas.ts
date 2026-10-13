import { Cita } from '../types';

export function obtenerUltimaCitaPaciente(
  pacienteId: string,
  citas: readonly Cita[],
): Cita | undefined {
  return citas
    .filter((cita) => cita.pacienteId === pacienteId)
    .reduce<Cita | undefined>((ultima, cita) => {
      if (!ultima || `${cita.fecha}T${cita.hora}` > `${ultima.fecha}T${ultima.hora}`) {
        return cita;
      }
      return ultima;
    }, undefined);
}
