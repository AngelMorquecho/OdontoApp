/** Lista de rutas del stack principal y los parámetros que recibe cada una. */
export type RootStackParamList = {
  ListaPacientes: undefined;
  EducacionPaciente: undefined;
  DiagnosticoIa: { pacienteId: string };
  AgendaCitas: undefined;
  AgendarCita: { pacienteId?: string } | undefined;
  Ajustes: { seccion?: 'respaldo' } | undefined;
  DetallePaciente: { pacienteId: string };
  AgregarPaciente: undefined;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
