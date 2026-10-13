import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaPacientes from './src/screens/ListaPacientes';
import EducacionPacienteScreen from './src/screens/EducacionPacienteScreen';
import DiagnosticoIaScreen from './src/screens/DiagnosticoIaScreen';
import AjustesScreen from './src/screens/AjustesScreen';
import DetallePaciente from './src/screens/DetallePaciente';
import AgregarPaciente from './src/screens/AgregarPaciente';
import AgendaCitasScreen from './src/screens/AgendaCitasScreen';
import AgendarCitaScreen from './src/screens/AgendarCitaScreen';
import ModalCrearReceta from './src/screens/ModalCrearReceta';
import PortalPacienteScreen from './src/screens/paciente/PortalPacienteScreen';
import LoginScreen from './src/screens/LoginScreen';
import type { RootStackParamList } from './src/navigation/types';
import { PacientesProvider } from './src/context/PacientesContext';
import { ConsultorioProvider } from './src/context/ConsultorioContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/constants/theme';
import { initializeMockData } from './src/utils/seedData';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [inicializado, setInicializado] = useState(false);
  const [errorInicializacion, setErrorInicializacion] = useState<string | null>(null);
  const [intentoInicializacion, setIntentoInicializacion] = useState(0);

  useEffect(() => {
    let activo = true;
    initializeMockData()
      .then(() => {
        if (activo) setInicializado(true);
      })
      .catch((error: unknown) => {
        if (activo) {
          setErrorInicializacion(
            error instanceof Error ? error.message : 'No se pudieron preparar los datos.',
          );
        }
      });
    return () => {
      activo = false;
    };
  }, [intentoInicializacion]);

  if (errorInicializacion) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <StatusBar barStyle="dark-content" />
        <Text style={{ color: colors.textPrimary, textAlign: 'center', marginBottom: 12 }}>
          {errorInicializacion}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setErrorInicializacion(null);
            setInicializado(false);
            setIntentoInicializacion((intento) => intento + 1);
          }}
          style={{ paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.primary }}
        >
          <Text style={{ color: colors.surface, fontWeight: '700' }}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }
  if (!inicializado) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

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
  const esPaciente = user.rol === 'paciente';

  if (cargandoAuth) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      key={`${isAuthenticated ? 'authenticated' : 'guest'}:${user.rol}:${user.pacienteId ?? ''}`}
    >
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator
        initialRouteName={
          !isAuthenticated
            ? 'Login'
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
        ) : esPaciente ? (
          <>
            <Stack.Screen
              name="PortalPaciente"
              component={PortalPacienteScreen}
              options={{ title: 'Portal Paciente', headerLeft: () => null }}
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
              name="EducacionPaciente"
              component={EducacionPacienteScreen}
              options={{ title: 'Educación al Paciente', headerLeft: () => null }}
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
              options={{ title: 'Ajustes del consultorio', headerLeft: () => null }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
