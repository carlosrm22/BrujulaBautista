import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ValueStepper } from '../../src/components/ValueStepper';
import { InfoTip } from '../../src/components/InfoTip';
import { computeSemaphore, SEMAFORO_COPY } from '../../src/semaphore/computeSemaphore';
import type { SemaphoreResult } from '../../src/db/initDb';
import { insertCheckIn, getLatestCheckIn } from '../../src/db/checkins';

export default function EstadoScreen() {
  const [energia, setEnergia] = useState(5);
  const [sensorial, setSensorial] = useState(0);
  const [social, setSocial] = useState(0);
  const [ambiguedad, setAmbiguedad] = useState(0);
  const [ira, setIra] = useState(0);
  const [saved, setSaved] = useState(false);

  const semaforo = useMemo<SemaphoreResult>(
    () => computeSemaphore(energia, sensorial, social, ambiguedad),
    [energia, sensorial, social, ambiguedad]
  );
  const copySemaforo = SEMAFORO_COPY[semaforo];

  const handleSave = useCallback(async () => {
    try {
      await insertCheckIn({
        energia_fisica: energia,
        carga_sensorial: sensorial,
        carga_social: social,
        ambiguedad,
        ira,
        semaforo_resultado: semaforo,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { }
  }, [energia, sensorial, social, ambiguedad, ira, semaforo]);

  useEffect(() => {
    getLatestCheckIn().then((row) => {
      if (row) {
        setEnergia(row.energia_fisica);
        setSensorial(row.carga_sensorial);
        setSocial(row.carga_social);
        setAmbiguedad(row.ambiguedad);
        setIra(row.ira);
      }
    });
  }, []);

  const semaforoBg = semaforo === 'VERDE' ? '#22c55e' : semaforo === 'AMARILLO' ? '#eab308' : '#ef4444';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Estado</Text>
        <View style={[styles.semaforoBox, { backgroundColor: semaforoBg }]}>
          <Text style={styles.semaforoText}>{semaforo}</Text>
        </View>
        <Text style={styles.copyAux}>{copySemaforo}</Text>

        <ValueStepper label="Energía física" value={energia} onValueChange={setEnergia}
          info="¿Cuánta energía corporal sientes ahora? 0 = agotado, no puedo moverme. 5 = normal. 10 = con mucha energía. Si estás en 2 o menos, el semáforo será ROJO." />
        <ValueStepper label="Carga sensorial" value={sensorial} onValueChange={setSensorial}
          info="¿Cuánto estímulo sensorial estás recibiendo? (ruido, luces, olores, texturas). 0 = calma total. 8+ = sobrecarga, el semáforo será ROJO. 6-7 = semáforo AMARILLO." />
        <ValueStepper label="Carga social" value={social} onValueChange={setSocial}
          info="¿Cuánta interacción social has tenido o estás teniendo? 0 = soledad total. 8+ = sobrecarga social, semáforo ROJO. 6-7 = semáforo AMARILLO." />
        <ValueStepper label="Ambigüedad" value={ambiguedad} onValueChange={setAmbiguedad}
          info="¿Qué tan confuso o incierto te sientes sobre qué hacer? 0 = tengo todo claro. 9+ = estoy paralizado sin saber qué hacer, semáforo ROJO." />
        <ValueStepper label="Activación (ira)" value={ira} onValueChange={setIra}
          info="¿Cuánta frustración, irritabilidad o ira sientes? 0 = tranquilo. 10 = muy irritado. Este valor se registra pero no afecta el semáforo directamente." />

        {/* Botón de registrar */}
        <Pressable
          style={({ pressed }) => [styles.saveBtn, saved && styles.saveBtnDone, pressed && styles.btnPressed]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>{saved ? '✓ Registrado' : 'Registrar check-in'}</Text>
        </Pressable>

        <View style={styles.buttons}>
          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnFlex, pressed && styles.btnPressed]}
              onPress={() => router.push('/(tabs)/arranque')}
            >
              <Text style={styles.btnText}>Arranque 2 min</Text>
            </Pressable>
            <InfoTip title="Arranque 2 min" description="Cuando no sabes por dónde empezar una tarea. Te guía paso a paso en 2 minutos para definir qué hacer, dónde empezar y cuál es el primer paso concreto." />
          </View>

          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [styles.focusBtn, styles.btnFlex, pressed && styles.btnPressed]}
              onPress={() => router.push('/sesion-foco')}
            >
              <Text style={styles.focusBtnText}>Sesión de foco</Text>
            </Pressable>
            <InfoTip title="Sesión de Foco (Guardián)" description="Un modo para hiperfoco que te recuerda tomar cortes suaves y te avisa cuando es tu hora límite de dormir. Útil para evitar el secuestro cognitivo prolongado." />
          </View>
          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnFlex, pressed && styles.btnPressed]}
              onPress={() => router.push('/rojo-descarga')}
            >
              <Text style={styles.btnText}>ROJO: Descarga</Text>
            </Pressable>
            <InfoTip title="ROJO: Descarga" description="Usa esto cuando el semáforo está en ROJO. Te guía con una checklist para descargar la sobrecarga antes de intentar hacer cualquier otra cosa. Primero descarga, luego decide." />
          </View>
          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnFlex, pressed && styles.btnPressed]}
              onPress={() => router.push('/social')}
            >
              <Text style={styles.btnText}>Pre/Post social</Text>
            </Pressable>
            <InfoTip title="Pre/Post social" description="Úsalo antes y después de una situación social. Antes: evalúas el riesgo sensorial y preparas estrategias. Después: registras el costo social y sensorial real para aprender de la experiencia." />
          </View>
          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnFlex, pressed && styles.btnPressed]}
              onPress={() => router.push('/pedir-apoyo')}
            >
              <Text style={styles.btnText}>Pedir apoyo (WhatsApp)</Text>
            </Pressable>
            <InfoTip title="Pedir apoyo (WhatsApp)" description="Envía un mensaje predefinido a tu pareja por WhatsApp pidiendo apoyo. Los mensajes están diseñados para ser claros, accionables y sin culpa. Puedes elegir entre distintas plantillas." />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#0f172a' },
  semaforoBox: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  semaforoText: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  copyAux: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  saveBtn: {
    marginTop: 20,
    minHeight: 50,
    backgroundColor: '#10b981',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  saveBtnDone: { backgroundColor: '#059669' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  buttons: { marginTop: 16, gap: 12 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    minHeight: 50,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  btnFlex: { flex: 1 },
  btnPressed: { opacity: 0.85 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  focusBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  focusBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
