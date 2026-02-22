import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Modal, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { insertTask, getPendingTasks, completeTask, deleteTask } from '../../src/db/tasks';
import type { TaskRow } from '../../src/db/initDb.native';
import { InfoTip } from '../../src/components/InfoTip';
import { startFocusSession } from '../../src/db/focusSessions';
import { getSetting } from '../../src/db/settings';

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
  const [pendingTasks, setPendingTasks] = useState<TaskRow[]>([]);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [finishingTask, setFinishingTask] = useState<TaskRow | null>(null);
  const [finishTime, setFinishTime] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!timerRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimerSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [timerRunning]);

  useEffect(() => {
    if (timerSec === 0) setTimerRunning(false);
  }, [timerSec]);

  const loadPending = useCallback(async () => {
    const tasks = await getPendingTasks();
    setPendingTasks(tasks);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (step === 1) loadPending();
    }, [step, loadPending])
  );

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
    setTimerRunning(false);
    setStep(3);
  }, [titulo, definicionDone, dondeEmpieza, primerPaso, requiereTecnica, tiempoMin, canStart]);

  const handleYaEmpece = useCallback(() => {
    // Si la tarea estimada toma más de 30 mins, sugerimos hiperfoco
    if (tiempoMin >= 30) {
      Alert.alert(
        'Sugerencia',
        'Tu tarea requiere atención prolongada. ¿Deseas activar el Guardián de Hiperfoco para que te avise tomar pausas y no perder el sueño?',
        [
          { text: 'No, gracias', style: 'cancel', onPress: resetArranque },
          { text: 'Sí, activarlo', style: 'default', onPress: activarHiperfoco }
        ]
      );
    } else {
      resetArranque();
    }
  }, [tiempoMin]);

  const resetArranque = () => {
    setStep(1);
    setTitulo('');
    setDefinicionDone('');
    setPrimerPaso('');
    setTimerRunning(false);
    loadPending();
  };

  const activarHiperfoco = async () => {
    // Resetear formulario interno
    setStep(1);
    setTitulo('');
    setDefinicionDone('');
    setPrimerPaso('');
    setTimerRunning(false);
    loadPending();

    const breakVal = await getSetting('foco_break_minutes');
    const bedVal = await getSetting('foco_bedtime_minutes');
    const breakMins = breakVal ? parseInt(breakVal, 10) : 45;
    const bedMins = bedVal ? parseInt(bedVal, 10) : 60;

    await startFocusSession({
      start_ts: Date.now(),
      linked_task_id: taskId || undefined,
      break_minutes: breakMins,
      bedtime_minutes: bedMins,
    });
    router.push('/sesion-foco');
  };

  const handleDeleteTask = (id: number) => {
    Alert.alert('Cancelar tarea', '¿Seguro que no hiciste esta tarea?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, borrar', style: 'destructive', onPress: async () => {
          await deleteTask(id);
          loadPending();
        }
      },
    ]);
  };

  const handleOpenFinish = (task: TaskRow) => {
    setFinishingTask(task);
    setFinishTime(String(task.tiempo_min)); // defecto es el estimado inicial
    setFinishModalVisible(true);
  };

  const handleConfirmFinish = async () => {
    if (!finishingTask) return;
    const t = parseInt(finishTime, 10) || 0;
    await completeTask(finishingTask.id, t);
    setFinishModalVisible(false);
    setFinishingTask(null);
    loadPending();
  };

  if (step === 'congelado') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Desambiguar</Text>
            <InfoTip
              title="Desambiguar"
              description="Estrategias para cuando te sientes congelado. Reducen la fricción mental a lo mínimo posible mediante micro-acciones."
            />
          </View>
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
              onPress={() => setTimerRunning((r) => !r)}
            >
              <Text style={styles.btnText}>{timerRunning ? 'Pausar' : 'Iniciar'}</Text>
            </Pressable>
            <Pressable style={styles.smallBtn} onPress={() => { setTimerSec(120); setTimerRunning(false); }}>
              <Text style={styles.btnText}>Reiniciar</Text>
            </Pressable>
          </View>
          <Pressable style={styles.btn} onPress={handleYaEmpece}>
            <Text style={styles.btnText}>Ya empecé</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnSec]} onPress={() => { setTimerRunning(false); setStep('congelado'); }}>
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
          <View style={styles.headerRow}>
            <Text style={styles.title}>Arranque 2 min</Text>
            <InfoTip
              title="Arranque de 2 minutos"
              description="Divide cualquier tarea abrumadora definiendo claramente qué significa terminarla y cuál es el primer paso físico e inmediato de 30 segundos, reduciendo la fricción para empezar."
            />
          </View>
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
        <View style={styles.headerRow}>
          <Text style={styles.title}>Arranque 2 min</Text>
          <InfoTip
            title="Arranque de 2 minutos"
            description="Divide cualquier tarea abrumadora definiendo claramente qué significa terminarla y cuál es el primer paso físico e inmediato de 30 segundos, reduciendo la fricción para empezar."
          />
        </View>
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

        {pendingTasks.length > 0 && (
          <View style={styles.pendingSection}>
            <Text style={styles.sectionTitle}>Tareas en curso</Text>
            {pendingTasks.map(task => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{task.titulo}</Text>
                  <Pressable onPress={() => handleDeleteTask(task.id)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </Pressable>
                </View>
                <Text style={styles.taskSub}>Est: {task.tiempo_min} min</Text>
                <Pressable style={styles.finishBtn} onPress={() => handleOpenFinish(task)}>
                  <Text style={styles.finishBtnText}>Finalizar</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal para finalizar tarea */}
      <Modal visible={finishModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Finalizar Tarea</Text>
            <Text style={styles.modalLabel}>¿Cuánto tiempo le dedicaste en total (minutos)?</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={finishTime}
              onChangeText={setFinishTime}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtnSec} onPress={() => setFinishModalVisible(false)}>
                <Text style={styles.modalBtnTextSec}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.modalBtn} onPress={handleConfirmFinish}>
                <Text style={styles.modalBtnText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '600' },
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
  optBtnActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  optBtnText: { fontSize: 14, color: '#64748b' },
  optBtnTextActive: { color: '#fff' },
  btn: {
    minHeight: 48,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.5 },
  btnSec: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#7c3aed' },
  btnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnTextSec: { fontSize: 16, fontWeight: '600', color: '#7c3aed' },
  stepLabel: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  primerPasoText: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  timerBox: { alignItems: 'center', marginVertical: 16 },
  timerText: { fontSize: 48, fontWeight: '700' },
  timerButtons: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 24 },
  smallBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
  },
  pendingSection: { marginTop: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#334155' },
  taskCard: { backgroundColor: '#fff', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1, marginRight: 8 },
  taskSub: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  finishBtn: { backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  finishBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Modal finalización
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16, color: '#0f172a' },
  modalLabel: { fontSize: 16, color: '#334155', marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 18, marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, backgroundColor: '#7c3aed', padding: 14, borderRadius: 8, alignItems: 'center' },
  modalBtnSec: { flex: 1, backgroundColor: '#f1f5f9', padding: 14, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  modalBtnTextSec: { color: '#475569', fontWeight: '600', fontSize: 16 },
});
