import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/context/ThemeContext';
import { getSetting } from '../src/db/settings';
import { DEFAULT_ROJO_CHECKLIST, SETTINGS_KEY_ROJO_CHECKLIST } from '../src/constants/rojoChecklist';

const DURACIONES = [10, 20, 40];

export default function RojoDescargaScreen() {
  const { colors } = useTheme();
  const [checklist, setChecklist] = useState<string[]>(DEFAULT_ROJO_CHECKLIST);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [duracion, setDuracion] = useState(20);
  const [timerActive, setTimerActive] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(20 * 60);
  const [showCierre, setShowCierre] = useState(false);

  useEffect(() => {
    getSetting(SETTINGS_KEY_ROJO_CHECKLIST).then((val) => {
      if (val) {
        try {
          setChecklist(JSON.parse(val));
        } catch {
          setChecklist(DEFAULT_ROJO_CHECKLIST);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!timerActive || timerRemaining <= 0) return;
    const id = setInterval(() => setTimerRemaining((r) => (r <= 1 ? 0 : r - 1)), 1000);
    return () => clearInterval(id);
  }, [timerActive, timerRemaining]);

  const toggleCheck = (index: number) => {
    setChecked((c) => ({ ...c, [index]: !c[index] }));
  };

  const startDescarga = () => {
    setTimerRemaining(duracion * 60);
    setTimerActive(true);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (showCierre) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.container}>
          <Text style={styles.title}>¿Mejoré?</Text>
          <View style={styles.cierreButtons}>
            <Pressable style={styles.cierreBtn} onPress={() => router.back()}>
              <Text style={styles.btnText}>Sí</Text>
            </Pressable>
            <Pressable style={styles.cierreBtn} onPress={() => router.back()}>
              <Text style={styles.btnText}>Un poco</Text>
            </Pressable>
            <Pressable
              style={styles.cierreBtn}
              onPress={() => router.replace('/pedir-apoyo')}
            >
              <Text style={styles.btnText}>No</Text>
            </Pressable>
          </View>
          <Text style={styles.ctaNo}>Si no mejoraste, pide apoyo.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (timerActive) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.container}>
          <Text style={styles.timerLabel}>Descarga</Text>
          <Text style={styles.timerValue}>{formatTime(timerRemaining)}</Text>
          {timerRemaining === 0 && (
            <Pressable style={styles.btn} onPress={() => setShowCierre(true)}>
              <Text style={styles.btnText}>Continuar</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>ROJO: Descarga</Text>
        {checklist.map((item, index) => (
          <Pressable
            key={item + index}
            style={styles.checkRow}
            onPress={() => toggleCheck(index)}
          >
            <View style={[styles.checkbox, checked[index] && styles.checkboxChecked]} />
            <Text style={styles.checkLabel}>{item}</Text>
          </Pressable>
        ))}
        <View style={styles.durationRow}>
          {DURACIONES.map((d) => (
            <Pressable
              key={d}
              style={[styles.durBtn, duracion === d && styles.durBtnActive]}
              onPress={() => setDuracion(d)}
            >
              <Text style={[styles.durBtnText, duracion === d && styles.durBtnTextActive]}>{d} min</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.btn} onPress={startDescarga}>
          <Text style={styles.btnText}>Iniciar descarga</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  container: { flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#64748b',
    borderRadius: 4,
    marginRight: 12,
  },
  checkboxChecked: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  checkLabel: { fontSize: 16, flex: 1 },
  durationRow: { flexDirection: 'row', gap: 12, marginVertical: 24 },
  durBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  durBtnActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  durBtnText: { fontSize: 16, color: '#64748b' },
  durBtnTextActive: { color: '#fff' },
  btn: {
    minHeight: 48,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  btnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  timerLabel: { fontSize: 18, color: '#64748b', marginBottom: 8 },
  timerValue: { fontSize: 48, fontWeight: '700', marginBottom: 24 },
  cierreButtons: { gap: 12, width: '100%', maxWidth: 280 },
  cierreBtn: {
    minHeight: 48,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaNo: { marginTop: 16, fontSize: 14, color: '#64748b' },
});
