import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { startFocusSession, closeFocusSession, getActiveFocusSession } from '../src/db/focusSessions';
import { getSetting } from '../src/db/settings';
import type { FocusSessionRow } from '../src/db/initDb.native';

// Constantes de ejemplo para los ajustes (idealmente vendrían de db/settings)
const DEFAULT_BREAK_MINUTES = 45;
const DEFAULT_BEDTIME_MINUTES = 60; // 01:00 AM = 60 mins desde medianoche

export default function SesionFocoScreen() {
    const [activeSession, setActiveSession] = useState<FocusSessionRow | null>(null);
    const [elapsedSecs, setElapsedSecs] = useState(0);
    const [nextBreakSecs, setNextBreakSecs] = useState(DEFAULT_BREAK_MINUTES * 60);
    const [nextBreakTargetTs, setNextBreakTargetTs] = useState<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Poll for active session or initialize
    useEffect(() => {
        getActiveFocusSession().then((session) => {
            if (session) {
                setActiveSession(session);
                const now = Date.now();
                const diff = Math.floor((now - session.start_ts) / 1000);
                setElapsedSecs(diff);

                getSetting('foco_break_minutes').then(val => {
                    const breakMins = val ? parseInt(val, 10) : DEFAULT_BREAK_MINUTES;
                    const breakIntervalSecs = breakMins * 60;
                    const remainingToNext = breakIntervalSecs - (diff % breakIntervalSecs);
                    setNextBreakSecs(remainingToNext);
                    setNextBreakTargetTs(now + remainingToNext * 1000);
                });
            }
        });
    }, []);

    // Timer tick
    useEffect(() => {
        if (activeSession && nextBreakTargetTs > 0) {
            timerRef.current = setInterval(() => {
                const now = Date.now();
                setElapsedSecs(Math.floor((now - activeSession.start_ts) / 1000));

                const remaining = Math.max(0, Math.floor((nextBreakTargetTs - now) / 1000));
                setNextBreakSecs(remaining);

                if (remaining === 0) {
                    // Auto-reset target if it naturally expired
                    const breakMins = activeSession.break_minutes || DEFAULT_BREAK_MINUTES;
                    setNextBreakTargetTs(now + breakMins * 60 * 1000);
                }
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeSession, nextBreakTargetTs]);

    const scheduleBreakNotification = async (seconds: number) => {
        await Notifications.cancelScheduledNotificationAsync('focus-break');
        await Notifications.scheduleNotificationAsync({
            identifier: 'focus-break',
            content: {
                title: 'Tiempo de corte suave',
                body: 'Es hora de hacer una pausa de 2 minutos. Descansa los ojos.',
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: seconds > 0 ? seconds : 1,
            },
        });
    };

    const scheduleBedtimeNotification = async (bedtimeMinutesOfDay: number) => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Calcular minutos faltantes. Si ya pasó la hora límite de hoy,
        // asumiremos que es para mañana (o que ya está en falta).
        // Calcularemos a futuro normal.
        let minutesToBedtime = bedtimeMinutesOfDay - currentMinutes;
        if (minutesToBedtime < 0) {
            minutesToBedtime += 1440; // Añadir 24h asumiendo el día sig
        }

        const secondsToBedtime = Math.max(1, minutesToBedtime * 60 - now.getSeconds());
        await Notifications.cancelScheduledNotificationAsync('focus-bedtime');
        await Notifications.scheduleNotificationAsync({
            identifier: 'focus-bedtime',
            content: {
                title: '🛑 Límite de Hiperfoco',
                body: 'Es hora de dormir. Por tu salud, desconéctate o pide apoyo a un contacto.',
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: secondsToBedtime,
            },
        });
    };

    const handleStart = async () => {
        const breakVal = await getSetting('foco_break_minutes');
        const bedVal = await getSetting('foco_bedtime_minutes');
        const breakMins = breakVal ? parseInt(breakVal, 10) : DEFAULT_BREAK_MINUTES;
        const bedMins = bedVal ? parseInt(bedVal, 10) : DEFAULT_BEDTIME_MINUTES;

        const id = await startFocusSession({
            start_ts: Date.now(),
            break_minutes: breakMins,
            bedtime_minutes: bedMins,
        });
        setActiveSession({
            id,
            start_ts: Date.now(),
            break_minutes: breakMins,
            bedtime_minutes: bedMins,
        });
        setElapsedSecs(0);
        setNextBreakSecs(breakMins * 60);
        setNextBreakTargetTs(Date.now() + breakMins * 60 * 1000);
        await scheduleBreakNotification(breakMins * 60);
        await scheduleBedtimeNotification(bedMins);
    };

    const handleStop = async (reason: string) => {
        if (!activeSession) return;

        // Calcular minutos extra pos-límite
        let over = 0;
        const bTime = activeSession.bedtime_minutes ?? DEFAULT_BEDTIME_MINUTES;
        const now = new Date();
        const cMins = now.getHours() * 60 + now.getMinutes();
        // Si la hora límite era antes o cercana, simple
        // Lógica súper básica: si es de madrugada (ej. límite 60) y actual es las 3 AM (180), over es 120.
        // Si límite era 23:00 (1380) y son las 01:00 (60 = 1500 del día anterior), pasaron 120.
        // Para simplificar, convertiremos a un bloque continuo de 48h desde ayer
        const todayMinRaw = cMins;
        const todayMinAdj = cMins < 12 * 60 ? cMins + 1440 : cMins; // Si es AM, sumar 24h
        const bTimeAdj = bTime < 12 * 60 ? bTime + 1440 : bTime;

        if (todayMinAdj > bTimeAdj) {
            over = todayMinAdj - bTimeAdj;
        }

        await closeFocusSession(activeSession.id, Date.now(), reason, over);
        if (timerRef.current) clearInterval(timerRef.current);
        await Notifications.cancelAllScheduledNotificationsAsync();
        setActiveSession(null);
        router.back();
    };

    const formatSecs = (totalSecs: number) => {
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    if (!activeSession) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.container}>
                    <Text style={styles.title}>Guardián de Hiperfoco</Text>
                    <Text style={styles.subtitle}>
                        Protege tu sueño y evita el secuestro cognitivo.
                    </Text>
                    <Pressable style={styles.startBtn} onPress={handleStart}>
                        <Text style={styles.startBtnText}>Iniciar sesión de foco</Text>
                    </Pressable>
                    <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeActive}>
            <View style={styles.container}>
                <Text style={styles.statusLabel}>Llevas en Hiperfoco:</Text>
                <Text style={styles.elapsedTime}>{formatSecs(elapsedSecs)}</Text>

                <View style={styles.breakCard}>
                    <Text style={styles.breakLabel}>Próximo corte suave en:</Text>
                    <Text style={styles.breakTime}>{formatSecs(nextBreakSecs)}</Text>
                </View>

                <View style={styles.actionsGrid}>
                    <Pressable style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => Alert.alert('Pausa', 'Cierra los ojos 2 minutos.')}>
                        <Text style={styles.actionBtnText}>Pausa 2 min</Text>
                    </Pressable>

                    <Pressable style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => {
                        setNextBreakSecs(25 * 60);
                        setNextBreakTargetTs(Date.now() + 25 * 60 * 1000);
                        scheduleBreakNotification(25 * 60);
                    }}>
                        <Text style={styles.actionBtnText}>Seguir 25 min</Text>
                    </Pressable>

                    <Pressable style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={() => handleStop('cierre')}>
                        <Text style={styles.actionBtnText}>Cierre 10 min</Text>
                    </Pressable>

                    <Pressable style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => handleStop('dormir')}>
                        <Text style={styles.actionBtnText}>Terminar (Dormir)</Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    safeActive: { flex: 1, backgroundColor: '#1e1b4b' }, // Dark purple when active
    container: { flex: 1, padding: 24, justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 16, color: '#0f172a' },
    subtitle: { fontSize: 16, textAlign: 'center', color: '#475569', marginBottom: 48 },
    startBtn: { backgroundColor: '#7c3aed', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
    startBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    cancelBtn: { paddingVertical: 18, alignItems: 'center' },
    cancelBtnText: { color: '#64748b', fontSize: 16, fontWeight: '600' },

    statusLabel: { color: '#c7d2fe', fontSize: 18, textAlign: 'center', marginBottom: 8 },
    elapsedTime: { color: '#fff', fontSize: 64, fontWeight: '800', textAlign: 'center', fontVariant: ['tabular-nums'], marginBottom: 48 },

    breakCard: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 16, marginBottom: 48, alignItems: 'center' },
    breakLabel: { color: '#a5b4fc', fontSize: 16, marginBottom: 8 },
    breakTime: { color: '#e0e7ff', fontSize: 32, fontWeight: '600', fontVariant: ['tabular-nums'] },

    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
    actionBtn: { width: '47%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
