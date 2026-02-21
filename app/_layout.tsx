import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initDb } from '../src/db/initDb';

export default function RootLayout() {
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
  }, []);

  if (!ready) return null;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webPlaceholder}>
        <Text style={styles.webTitle}>Brújula</Text>
        <Text style={styles.webText}>
          Esta app usa almacenamiento local (SQLite) y está pensada para usarse en el móvil.
        </Text>
        <Text style={styles.webText}>
          Abre la app <Text style={styles.webBold}>Expo Go</Text> en tu teléfono, escanea el código QR
          que aparece en la terminal donde ejecutaste <Text style={styles.webCode}>npx expo start</Text>, y
          abre el proyecto desde ahí.
        </Text>
        <Text style={styles.webSub}>Asegúrate de que el móvil y el PC estén en la misma red WiFi.</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="rojo-descarga" options={{ presentation: 'modal' }} />
        <Stack.Screen name="pedir-apoyo" />
        <Stack.Screen name="social" />
        <Stack.Screen name="protocolos/[id]" />
        <Stack.Screen name="ajustes/plantillas" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8fafc',
  },
  webTitle: { fontSize: 28, fontWeight: '700', marginBottom: 24, color: '#1e293b' },
  webText: { fontSize: 16, textAlign: 'center', color: '#475569', marginBottom: 16, lineHeight: 24 },
  webBold: { fontWeight: '700', color: '#1e293b' },
  webCode: { fontFamily: 'monospace', backgroundColor: '#e2e8f0', paddingHorizontal: 6 },
  webSub: { fontSize: 14, color: '#64748b', marginTop: 8 },
});
