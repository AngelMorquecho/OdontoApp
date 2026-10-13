import React from 'react';
import SegmentedControl from './SegmentedControl';

type SeccionPrincipal = 'pacientes' | 'agenda';

interface Props {
  seccion: SeccionPrincipal;
  onSeleccionar: (seccion: SeccionPrincipal) => void;
}

const OPCIONES = [
  { valor: 'pacientes', etiqueta: 'Pacientes', icono: 'account-multiple-outline' },
  { valor: 'agenda', etiqueta: 'Agenda de Citas', icono: 'calendar-month-outline' },
] as const;

export default function NavegacionPrincipal({ seccion, onSeleccionar }: Props) {
  return (
    <SegmentedControl
      opciones={[...OPCIONES]}
      valorSeleccionado={seccion}
      onSeleccionar={onSeleccionar}
    />
  );
}
