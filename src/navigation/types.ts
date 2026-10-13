/** Lista de rutas del stack principal y los parámetros que recibe cada una. */
export type RootStackParamList = {
  Login: undefined;
  ListaPacientes: undefined;
  PortalPaciente: { seccion?: 'citas' | 'tratamiento' } | undefined;
  EducacionPaciente: undefined;
  DiagnosticoIa: { pacienteId: string };
  AgendaCitas: undefined;
  AgendarCita: { pacienteId?: string } | undefined;
  CrearReceta: { pacienteId: string };
  Ajustes: { seccion?: 'respaldo' } | undefined;
  DetallePaciente: { pacienteId: string; pestana?: 'odontograma' | 'notas' };
  AgregarPaciente: undefined;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
