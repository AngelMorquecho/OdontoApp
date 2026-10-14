import React from 'react';
import {
  ActivityIndicator,
  StatusBar,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaPacientes from './src/screens/ListaPacientes';
import EducacionPacienteScreen from './src/screens/EducacionPacienteScreen';
import AjustesScreen from './src/screens/AjustesScreen';
import DetallePaciente from './src/screens/DetallePaciente';
import AgregarPaciente from './src/screens/AgregarPaciente';
import AgendaCitasScreen from './src/screens/AgendaCitasScreen';
import AgendarCitaScreen from './src/screens/AgendarCitaScreen';
import ModalCrearReceta from './src/screens/ModalCrearReceta';
import PortalPacienteScreen from './src/screens/paciente/PortalPacienteScreen';
import LoginScreen from './src/screens/LoginScreen';
import AdminDoctoresScreen from './src/screens/AdminDoctoresScreen';
import NuevoTratamientoModal from './src/screens/NuevoTratamientoModal';
import RegistrarAbonoModal from './src/screens/RegistrarAbonoModal';
import type { RootStackParamList } from './src/navigation/types';
import { PacientesProvider } from './src/context/PacientesContext';
import { ConsultorioProvider } from './src/context/ConsultorioContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AuthProvider>
      <PacientesProvider>
        <ConsultorioProvider>
          <AppNavegacion />
        </ConsultorioProvider>
      </PacientesProvider>
    </AuthProvider>
  );
}

function AppNavegacion() {
  const { user, isAuthenticated, cargandoAuth } = useAuth();
  const esPaciente = user?.rol === 'PACIENTE';
  const esSuperAdmin = user?.rol === 'SUPER_ADMIN';

  if (cargandoAuth) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      key={`${isAuthenticated ? 'authenticated' : 'guest'}:${user?.rol ?? 'none'}:${user?.doctorId ?? ''}:${user?.pacienteId ?? ''}`}
    >
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator
        initialRouteName={
          !isAuthenticated
            ? 'Login'
            : esSuperAdmin
              ? 'AdminDoctores'
              : esPaciente
              ? 'PortalPaciente'
              : 'ListaPacientes'
        }
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: '', headerShown: false }}
          />
        ) : esSuperAdmin ? (
          <Stack.Screen
            name="AdminDoctores"
            component={AdminDoctoresScreen}
            options={{ title: 'Gestión de doctores', headerLeft: () => null }}
          />
        ) : esPaciente ? (
          <>
            <Stack.Screen
              name="PortalPaciente"
              component={PortalPacienteScreen}
              options={{ title: 'Portal Paciente', headerLeft: () => null }}
            />
            <Stack.Screen
              name="EducacionPaciente"
              component={EducacionPacienteScreen}
              options={{ title: 'Educación e Higiene', headerLeft: () => null }}
            />
            <Stack.Screen
              name="Ajustes"
              component={AjustesScreen}
              options={{ title: 'Perfil y acceso' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="ListaPacientes"
              component={ListaPacientes}
              options={{ title: 'Pacientes', headerLeft: () => null }}
            />
            <Stack.Screen
              name="AgendaCitas"
              component={AgendaCitasScreen}
              options={{ title: 'Agenda de Citas', headerLeft: () => null }}
            />
            <Stack.Screen
              name="AgendarCita"
              component={AgendarCitaScreen}
              options={{ title: 'Agendar Cita', presentation: 'modal' }}
            />
            <Stack.Screen
              name="CrearReceta"
              component={ModalCrearReceta}
              options={{ title: 'Crear nueva receta', presentation: 'modal' }}
            />
            <Stack.Screen
              name="NuevoTratamiento"
              component={NuevoTratamientoModal}
              options={{ title: 'Nuevo tratamiento', presentation: 'modal' }}
            />
            <Stack.Screen
              name="RegistrarAbono"
              component={RegistrarAbonoModal}
              options={{ title: 'Registrar abono', presentation: 'modal' }}
            />
            <Stack.Screen
              name="EducacionPaciente"
              component={EducacionPacienteScreen}
              options={{ title: 'Educación al Paciente', headerLeft: () => null }}
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
              options={{ title: 'Ajustes del consultorio', headerLeft: () => null }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
