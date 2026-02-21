import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSetting, setSetting } from '../../src/db/settings';
import { DEFAULT_ROJO_CHECKLIST, SETTINGS_KEY_ROJO_CHECKLIST } from '../../src/constants/rojoChecklist';
import { getDb } from '../../src/db/initDb';

export default function AjustesScreen() {
  const [rojoChecklist, setRojoChecklist] = useState<string[]>(DEFAULT_ROJO_CHECKLIST);
  const [editSection, setEditSection] = useState<'none' | 'rojo'>('none');

  useEffect(() => {
    getSetting(SETTINGS_KEY_ROJO_CHECKLIST).then((val) => {
      if (val) {
        try {
          setRojoChecklist(JSON.parse(val));
        } catch {
          setRojoChecklist(DEFAULT_ROJO_CHECKLIST);
        }
      }
    });
  }, []);

  const saveRojoChecklist = () => {
    setSetting(SETTINGS_KEY_ROJO_CHECKLIST, JSON.stringify(rojoChecklist)).then(() =>
      setEditSection('none')
    );
  };

  const updateRojoItem = (index: number, text: string) => {
    setRojoChecklist((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const exportData = async () => {
    const db = getDb();
    if (!db) return;
    const checkins = await db.getAllAsync('SELECT * FROM checkins');
    const tasks = await db.getAllAsync('SELECT * FROM tasks');
    const protocols = await db.getAllAsync('SELECT * FROM protocols');
    const social = await db.getAllAsync('SELECT * FROM social_logs');
    const settings: Record<string, string> = {};
    const settingsRows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
    settingsRows.forEach((r: { key: string; value: string }) => (settings[r.key] = r.value));
    const payload = {
      exportAt: new Date().toISOString(),
      checkins,
      tasks,
      protocols,
      social_logs: social,
      settings,
    };
    const path = FileSystem.documentDirectory + `brujula_export_${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'application/json' });
    }
  };

  const importData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const uri = result.assets[0].uri;
      const raw = await FileSystem.readAsStringAsync(uri);
      const payload = JSON.parse(raw) as { settings?: Record<string, string> };
      if (payload.settings && typeof payload.settings === 'object') {
        for (const [key, value] of Object.entries(payload.settings)) {
          if (typeof value === 'string') await setSetting(key, value);
        }
        const val = await getSetting(SETTINGS_KEY_ROJO_CHECKLIST);
        if (val) {
          try {
            setRojoChecklist(JSON.parse(val));
          } catch {
            setRojoChecklist(DEFAULT_ROJO_CHECKLIST);
          }
        }
        Alert.alert('Importar', 'Ajustes restaurados.');
      } else {
        Alert.alert('Importar', 'El archivo no contiene ajustes válidos.');
      }
    } catch (e) {
      Alert.alert('Importar', 'No se pudo leer el archivo.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Ajustes</Text>

        <Text style={styles.sectionTitle}>Checklist ROJO</Text>
        {editSection === 'rojo' ? (
          <>
            {rojoChecklist.map((item, index) => (
              <TextInput
                key={index}
                style={styles.input}
                value={item}
                onChangeText={(t) => updateRojoItem(index, t)}
              />
            ))}
            <Pressable style={styles.btn} onPress={saveRojoChecklist}>
              <Text style={styles.btnText}>Guardar</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.link} onPress={() => setEditSection('rojo')}>
            <Text style={styles.linkText}>Editar checklist ROJO</Text>
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>Plantillas WhatsApp</Text>
        <Pressable style={styles.link} onPress={() => router.push('/ajustes/plantillas')}>
          <Text style={styles.linkText}>Editar pedidos y acciones sugeridas</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Privacidad</Text>
        <Text style={styles.copy}>Sin analíticas. Sin cuenta. Datos solo en este dispositivo.</Text>

        <Text style={styles.sectionTitle}>Backup</Text>
        <Pressable style={styles.btn} onPress={exportData}>
          <Text style={styles.btnText}>Exportar</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnSec]} onPress={importData}>
          <Text style={styles.btnTextSec}>Importar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  link: { paddingVertical: 12, marginBottom: 16 },
  linkText: { fontSize: 16, color: '#2563eb' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  btn: {
    minHeight: 48,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  btnSec: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#2563eb' },
  btnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnTextSec: { fontSize: 16, fontWeight: '600', color: '#2563eb' },
  copy: { fontSize: 14, color: '#64748b', marginBottom: 24 },
});
