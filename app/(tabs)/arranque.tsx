import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { insertTask } from '../../src/db/tasks';

const DONDE_OPCIONES = ['Archivo', 'App', 'Objeto', 'Lugar'];
const TIEMPO_OPCIONES = [2, 5, 15, 45];

type Step = 1 | 2 | 3 | 'congelado';

export default function ArranqueScreen() {
  const [step, setStep] = useState<Step>(1);
  const [titulo, setTitulo] = useState('');
  const [definicionDone, setDefinicionDone] = useState('');
  const [dondeEmpieza, setDondeEmpieza] = useState('Archivo');
  const [primerPaso, setPrimerPaso] = useState('');
  const [requiereTecnica, setRequiereTecnica] = useState(false);
  const [tiempoMin, setTiempoMin] = useState(2);
  const [taskId, setTaskId] = useState<number | null>(null);
  const [timerSec, setTimerSec] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);

  const canNext1 = titulo.trim().length > 0;
  const canStart = definicionDone.trim().length > 0 && primerPaso.trim().length > 0;

  const goStep2 = useCallback(() => {
    if (!canNext1) return;
    setStep(2);
  }, [canNext1]);

  const goStep3 = useCallback(async () => {
    if (!canStart) return;
    const id = await insertTask({
      titulo: titulo.trim(),
      definicion_done: definicionDone.trim(),
      donde_empieza: dondeEmpieza,
      primer_paso: primerPaso.trim(),
      requiere_tecnica: requiereTecnica ? 1 : 0,
      tiempo_min: tiempoMin,
    });
    setTaskId(id);
    setTimerSec(120);
    setStep(3);
  }, [titulo, definicionDone, dondeEmpieza, primerPaso, requiereTecnica, tiempoMin, canStart]);

  const handleYaEmpece = useCallback(() => {
    setStep(1);
    setTitulo('');
    setDefinicionDone('');
    setPrimerPaso('');
  }, []);

  if (step === 'congelado') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Desambiguar</Text>
          <Text style={styles.subtitle}>Elige una sola cosa.</Text>
          <Pressable style={styles.btn} onPress={() => setStep(3)}>
            <Text style={styles.btnText}>Hacer el primer paso físico (30s)</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={() => setStep(3)}>
            <Text style={styles.btnText}>Definir "terminado" en 7 palabras</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnSec]} onPress={() => setStep(3)}>
            <Text style={styles.btnTextSec}>Volver al timer</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 3) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.stepLabel}>Primer paso:</Text>
          <Text style={styles.primerPasoText}>{primerPaso}</Text>
          <View style={styles.timerBox}>
            <Text style={styles.timerText}>
              {Math.floor(timerSec / 60)
                .toString()
                .padStart(2, '0')}
              :{(timerSec % 60).toString().padStart(2, '0')}
            </Text>
          </View>
          <View style={styles.timerButtons}>
            <Pressable
              style={styles.smallBtn}
              onPress={() => {
                setTimerRunning(!timerRunning);
                if (!timerRunning) {
                  const id = setInterval(() => {
                    setTimerSec((s) => (s <= 0 ? 0 : s - 1));
                  }, 1000);
                  setTimeout(() => clearInterval(id), timerSec * 1000);
                }
              }}
            >
              <Text style={styles.btnText}>{timerRunning ? 'Pausar' : 'Iniciar'}</Text>
            </Pressable>
            <Pressable style={styles.smallBtn} onPress={() => setTimerSec(120)}>
              <Text style={styles.btnText}>Reiniciar</Text>
            </Pressable>
          </View>
          <Pressable style={styles.btn} onPress={handleYaEmpece}>
            <Text style={styles.btnText}>Ya empecé</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnSec]} onPress={() => setStep('congelado')}>
            <Text style={styles.btnTextSec}>Me congelé</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 2) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Arranque 2 min</Text>
          <Text style={styles.label}>¿Qué significa "terminado"?</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: balances actualizados al día"
            value={definicionDone}
            onChangeText={setDefinicionDone}
          />
          <Text style={styles.label}>¿Dónde empieza físicamente?</Text>
          <View style={styles.optionsRow}>
            {DONDE_OPCIONES.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.optBtn, dondeEmpieza === opt && styles.optBtnActive]}
                onPress={() => setDondeEmpieza(opt)}
              >
                <Text style={[styles.optBtnText, dondeEmpieza === opt && styles.optBtnTextActive]}>{opt}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Primer paso de 30 segundos</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: abrir el archivo de balances"
            value={primerPaso}
            onChangeText={setPrimerPaso}
          />
          <Text style={styles.label}>¿Requiere técnica correcta?</Text>
          <View style={styles.optionsRow}>
            <Pressable
              style={[styles.optBtn, !requiereTecnica && styles.optBtnActive]}
              onPress={() => setRequiereTecnica(false)}
            >
              <Text style={[styles.optBtnText, !requiereTecnica && styles.optBtnTextActive]}>No</Text>
            </Pressable>
            <Pressable
              style={[styles.optBtn, requiereTecnica && styles.optBtnActive]}
              onPress={() => setRequiereTecnica(true)}
            >
              <Text style={[styles.optBtnText, requiereTecnica && styles.optBtnTextActive]}>Sí</Text>
            </Pressable>
          </View>
          <Text style={styles.label}>Tiempo mínimo hoy</Text>
          <View style={styles.optionsRow}>
            {TIEMPO_OPCIONES.map((t) => (
              <Pressable
                key={t}
                style={[styles.optBtn, tiempoMin === t && styles.optBtnActive]}
                onPress={() => setTiempoMin(t)}
              >
                <Text style={[styles.optBtnText, tiempoMin === t && styles.optBtnTextActive]}>{t} min</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={[styles.btn, !canStart && styles.btnDisabled]} onPress={goStep3} disabled={!canStart}>
            <Text style={styles.btnText}>Empezar</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnSec]} onPress={() => setStep(1)}>
            <Text style={styles.btnTextSec}>Atrás</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Arranque 2 min</Text>
        <Text style={styles.label}>¿Qué quieres hacer hoy?</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: actualizar estados financieros"
          value={titulo}
          onChangeText={setTitulo}
        />
        <Pressable style={[styles.btn, !canNext1 && styles.btnDisabled]} onPress={goStep2} disabled={!canNext1}>
          <Text style={styles.btnText}>Siguiente</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 6, color: '#334155' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
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
  btn: {
    minHeight: 48,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.5 },
  btnSec: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#2563eb' },
  btnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnTextSec: { fontSize: 16, fontWeight: '600', color: '#2563eb' },
  stepLabel: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  primerPasoText: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  timerBox: { alignItems: 'center', marginVertical: 16 },
  timerText: { fontSize: 48, fontWeight: '700' },
  timerButtons: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 24 },
  smallBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
});
