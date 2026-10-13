import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaPacientes from './src/screens/ListaPacientes';
import DetallePaciente from './src/screens/DetallePaciente';
import AgregarPaciente from './src/screens/AgregarPaciente';
import { RootStackParamList } from './src/navigation/types';
import { PacientesProvider } from './src/context/PacientesContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <PacientesProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <Stack.Navigator initialRouteName="ListaPacientes">
          <Stack.Screen
            name="ListaPacientes"
            component={ListaPacientes}
            options={{ title: 'Pacientes' }}
          />
          <Stack.Screen
            name="DetallePaciente"
            component={DetallePaciente}
            options={{ title: 'Detalle del paciente' }}
          />
          <Stack.Screen
            name="AgregarPaciente"
            component={AgregarPaciente}
            options={{
              title: 'Agregar nuevo paciente',
              presentation: 'modal',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PacientesProvider>
  );
}

