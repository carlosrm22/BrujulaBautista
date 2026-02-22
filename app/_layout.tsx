import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { initDb } from '../src/db/initDb';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AppShell() {
  const { theme, colors } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDb()
      .then(() => setReady(true))
      .catch((e: unknown) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('DB init failed', e);
        }
        setReady(true);
      });

    Notifications.requestPermissionsAsync().then((status) => {
      if (status.status !== 'granted') {
        console.warn('No se otorgaron permisos de notificación.');
      }
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { cta?: string } | undefined;
      if (data?.cta === 'bedtime') {
        router.navigate({ pathname: '/sesion-foco', params: { cta: 'bedtime' } });
      }
    });

    return () => sub.remove();
  }, []);

  if (!ready) return null;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webPlaceholder, { backgroundColor: colors.bg }]}>
        <Text style={[styles.webTitle, { color: colors.text }]}>Brújula</Text>
        <Text style={[styles.webText, { color: colors.textSecond }]}>
          Esta app usa almacenamiento local (SQLite) y está pensada para usarse en el móvil.
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="rojo-descarga" />
        <Stack.Screen name="pedir-apoyo" />
        <Stack.Screen name="social" />
        <Stack.Screen name="protocolos/[id]" />
        <Stack.Screen name="ajustes/plantillas" />
        <Stack.Screen name="sesion-foco" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  webTitle: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
  webText: { fontSize: 16, textAlign: 'center', marginBottom: 16, lineHeight: 24 },
});
