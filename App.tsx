import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaPacientes from './src/screens/ListaPacientes';
import EducacionPacienteScreen from './src/screens/EducacionPacienteScreen';
import DiagnosticoIaScreen from './src/screens/DiagnosticoIaScreen';
import AjustesScreen from './src/screens/AjustesScreen';
import DetallePaciente from './src/screens/DetallePaciente';
import AgregarPaciente from './src/screens/AgregarPaciente';
import { RootStackParamList } from './src/navigation/types';
import { PacientesProvider } from './src/context/PacientesContext';
import { ConsultorioProvider } from './src/context/ConsultorioContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <PacientesProvider>
      <ConsultorioProvider>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" />
          <Stack.Navigator initialRouteName="ListaPacientes">
            <Stack.Screen
              name="ListaPacientes"
              component={ListaPacientes}
              options={{ title: 'Pacientes' }}
            />
            <Stack.Screen
              name="EducacionPaciente"
              component={EducacionPacienteScreen}
              options={{ title: 'Educación al Paciente' }}
            />
            <Stack.Screen
              name="DiagnosticoIa"
              component={DiagnosticoIaScreen}
              options={{ title: 'Diagnóstico asistido por IA' }}
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
            <Stack.Screen
              name="Ajustes"
              component={AjustesScreen}
              options={{ title: 'Ajustes del consultorio' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ConsultorioProvider>
    </PacientesProvider>
  );
}
