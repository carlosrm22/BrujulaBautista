import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ValueStepper } from '../src/components/ValueStepper';
import { insertSocialLog } from '../src/db/socialLogs';

const DURACION_OPTS = ['15m', '30m', '1h', '2h', 'No sé'];
const RIESGO_OPTS = ['Bajo', 'Medio', 'Alto'];

export default function SocialScreen() {
  const [tab, setTab] = useState<'antes' | 'despues'>('antes');
  const [duracion, setDuracion] = useState('');
  const [riesgo, setRiesgo] = useState('');
  const [llevarTapones, setLlevarTapones] = useState(false);
  const [costoSocial, setCostoSocial] = useState(0);
  const [costoSensorial, setCostoSensorial] = useState(0);
  const [guardado, setGuardado] = useState(false);

  const showGuardado = () => {
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const handleGuardarAntes = async () => {
    await insertSocialLog({
      fase: 'antes',
      duracion: duracion || undefined,
      riesgo_sensorial: riesgo || undefined,
      llevar_tapones: llevarTapones ? 1 : 0,
    });
    showGuardado();
  };

  const handleRegistrarDespues = async () => {
    await insertSocialLog({
      fase: 'despues',
      costo_social: costoSocial,
      costo_sensorial: costoSensorial,
    });
    showGuardado();
    if (costoSocial >= 7 || costoSensorial >= 7) {
      router.push('/rojo-descarga');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'antes' && styles.tabActive]}
          onPress={() => setTab('antes')}
        >
          <Text style={[styles.tabText, tab === 'antes' && styles.tabTextActive]}>Antes</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'despues' && styles.tabActive]}
          onPress={() => setTab('despues')}
        >
          <Text style={[styles.tabText, tab === 'despues' && styles.tabTextActive]}>Después</Text>
        </Pressable>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {tab === 'antes' && (
          <>
            <Text style={styles.label}>¿Cuánto durará?</Text>
            <View style={styles.optionsRow}>
              {DURACION_OPTS.map((d) => (
                <Pressable
                  key={d}
                  style={[styles.optBtn, duracion === d && styles.optBtnActive]}
                  onPress={() => setDuracion(d)}
                >
                  <Text style={[styles.optBtnText, duracion === d && styles.optBtnTextActive]}>{d}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Riesgo sensorial</Text>
            <View style={styles.optionsRow}>
              {RIESGO_OPTS.map((r) => (
                <Pressable
                  key={r}
                  style={[styles.optBtn, riesgo === r && styles.optBtnActive]}
                  onPress={() => setRiesgo(r)}
                >
                  <Text style={[styles.optBtnText, riesgo === r && styles.optBtnTextActive]}>{r}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Llevar tapones</Text>
              <Pressable
                style={[styles.toggle, llevarTapones && styles.toggleOn]}
                onPress={() => setLlevarTapones(!llevarTapones)}
              >
                <Text style={styles.toggleText}>{llevarTapones ? 'Sí' : 'No'}</Text>
              </Pressable>
            </View>
            <Pressable style={[styles.btn, guardado && { backgroundColor: '#10b981' }]} onPress={handleGuardarAntes}>
              <Text style={styles.btnText}>{guardado ? '✓ Guardado' : 'Guardar'}</Text>
            </Pressable>
          </>
        )}
        {tab === 'despues' && (
          <>
            <ValueStepper
              label="Costo social (0–10)"
              value={Math.round(costoSocial)}
              onValueChange={setCostoSocial}
            />
            <ValueStepper
              label="Costo sensorial (0–10)"
              value={Math.round(costoSensorial)}
              onValueChange={setCostoSensorial}
            />
            <Pressable style={[styles.btn, guardado && { backgroundColor: '#10b981' }]} onPress={handleRegistrarDespues}>
              <Text style={styles.btnText}>{guardado ? '✓ Registrado' : 'Registrar'}</Text>
            </Pressable>
            {(costoSocial >= 7 || costoSensorial >= 7) && (
              <Pressable style={[styles.btn, styles.btnSec]} onPress={() => router.push('/rojo-descarga')}>
                <Text style={styles.btnTextSec}>Ir a ROJO: Descarga</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  tabText: { fontSize: 16, color: '#64748b' },
  tabTextActive: { color: '#2563eb', fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  label: { fontSize: 14, marginBottom: 8, color: '#334155' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  optBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  optBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  optBtnText: { fontSize: 14, color: '#64748b' },
  optBtnTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  toggle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  toggleOn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  toggleText: { fontSize: 14 },
  btn: {
    minHeight: 48,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  btnSec: { marginTop: 12, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#2563eb' },
  btnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnTextSec: { fontSize: 16, fontWeight: '600', color: '#2563eb' },
});
