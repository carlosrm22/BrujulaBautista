import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { startFocusSession, closeFocusSession, getActiveFocusSession } from '../src/db/focusSessions';
import { getSetting } from '../src/db/settings';
import type { FocusSessionRow } from '../src/db/initDb.native';
import { useTheme } from '../src/context/ThemeContext';

const DEFAULT_BREAK_MINUTES = 45;
const DEFAULT_BEDTIME_MINUTES = 60; // 01:00 AM = 60 mins desde medianoche

export default function SesionFocoScreen() {
    const { colors } = useTheme();
    const { cta } = useLocalSearchParams<{ cta?: string }>();
    const [activeSession, setActiveSession] = useState<FocusSessionRow | null>(null);
    const [elapsedSecs, setElapsedSecs] = useState(0);
    const [nextBreakSecs, setNextBreakSecs] = useState(DEFAULT_BREAK_MINUTES * 60);
    const [nextBreakTargetTs, setNextBreakTargetTs] = useState<number>(0);
    const [isOvertime, setIsOvertime] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // ─── Notificaciones ─────────────────────────────────────────────────────────

    /** Break repetitivo: usa repeats:true para que el SO lo re-dispare solo */
    const scheduleBreakNotification = async (breakMins: number) => {
        await Notifications.cancelScheduledNotificationAsync('focus-break').catch(() => { });
        await Notifications.scheduleNotificationAsync({
            identifier: 'focus-break',
            content: {
                title: '⏸ Corte suave',
                body: 'Pausa 2 minutos. Descansa los ojos y mueve el cuerpo.',
                sound: false,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: breakMins * 60,
                repeats: true,
            },
        });
    };

    /** Bedtime: programa 3 alertas — en el límite, +30 y +60 con CTA WhatsApp */
    const scheduleBedtimeNotifications = async (bedtimeMinutesOfDay: number) => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        let minutesToBedtime = bedtimeMinutesOfDay - currentMinutes;
        if (minutesToBedtime < 0) minutesToBedtime += 1440;

        const secondsBase = Math.max(1, minutesToBedtime * 60 - now.getSeconds());

        // Cancelar las tres anteriores
        await Promise.all([
            Notifications.cancelScheduledNotificationAsync('focus-bedtime').catch(() => { }),
            Notifications.cancelScheduledNotificationAsync('focus-bedtime+30').catch(() => { }),
            Notifications.cancelScheduledNotificationAsync('focus-bedtime+60').catch(() => { }),
        ]);

        // Alerta 1: hora límite exacta
        await Notifications.scheduleNotificationAsync({
            identifier: 'focus-bedtime',
            content: {
                title: '🛑 Hora de dormir',
                body: 'Llegaste a tu límite. Desconéctate ahora por tu salud.',
                sound: false,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: secondsBase,
            },
        });

        // Alerta 2: +30 minutos después del límite
        await Notifications.scheduleNotificationAsync({
            identifier: 'focus-bedtime+30',
            content: {
                title: '⚠️ +30 min en hiperfoco',
                body: 'Llevas 30 minutos extra. ¿Avisas a tu red de apoyo?',
                sound: false,
                data: { cta: 'bedtime' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: secondsBase + 30 * 60,
            },
        });

        // Alerta 3: +60 minutos después del límite
        await Notifications.scheduleNotificationAsync({
            identifier: 'focus-bedtime+60',
            content: {
                title: '🆘 +60 min en hiperfoco',
                body: 'Una hora extra sin dormir. Pide apoyo ya.',
                sound: false,
                data: { cta: 'bedtime' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: secondsBase + 60 * 60,
            },
        });
    };

    /** Sincroniza todas las notificaciones con la sesión activa.
     *  Se llama al arrancar desde esta pantalla Y al reanudar una sesión existente.
     */
    const ensureFocusNotifications = async (session: FocusSessionRow) => {
        const breakMins = session.break_minutes ?? DEFAULT_BREAK_MINUTES;
        const bedMins = session.bedtime_minutes ?? DEFAULT_BEDTIME_MINUTES;
        await scheduleBreakNotification(breakMins);
        await scheduleBedtimeNotifications(bedMins);
    };

    // ─── Estado inicial ──────────────────────────────────────────────────────────

    useEffect(() => {
        getActiveFocusSession().then((session) => {
            if (session) {
                setActiveSession(session);
                const now = Date.now();
                const diff = Math.floor((now - session.start_ts) / 1000);
                setElapsedSecs(diff);

                const breakMins = session.break_minutes ?? DEFAULT_BREAK_MINUTES;
                const breakIntervalSecs = breakMins * 60;
                const remainingToNext = breakIntervalSecs - (diff % breakIntervalSecs);
                setNextBreakSecs(remainingToNext);
                setNextBreakTargetTs(now + remainingToNext * 1000);

                // 🔑 Re-sincronizar notificaciones al reanudar (fix: arranque → hiperfoco)
                ensureFocusNotifications(session);

                // Detectar overtime
                const bedMins = session.bedtime_minutes ?? DEFAULT_BEDTIME_MINUTES;
                const curMins = new Date().getHours() * 60 + new Date().getMinutes();
                const curAdj = curMins < 12 * 60 ? curMins + 1440 : curMins;
                const bedAdj = bedMins < 12 * 60 ? bedMins + 1440 : bedMins;
                if (curAdj > bedAdj) setIsOvertime(true);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Mostrar CTA WhatsApp si llegó por notificación de bedtime ──────────────
    useEffect(() => {
        if (cta === 'bedtime' && activeSession) {
            Alert.alert(
                '⚠️ Llevas tiempo extra',
                '¿Quieres pedir apoyo a tu red de rescate?',
                [
                    { text: 'No por ahora', style: 'cancel' },
                    {
                        text: 'Pedir apoyo (WhatsApp)',
                        onPress: () => {
                            const msg = encodeURIComponent(
                                '🆘 Sigo en hiperfoco. Necesito que me recuerdes dormir.'
                            );
                            Linking.openURL(`whatsapp://send?text=${msg}`).catch(() => {
                                Alert.alert('No se pudo abrir WhatsApp');
                            });
                        },
                    },
                ]
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cta, activeSession]);

    // ─── Timer tick ─────────────────────────────────────────────────────────────

    useEffect(() => {
        if (activeSession && nextBreakTargetTs > 0) {
            timerRef.current = setInterval(() => {
                const now = Date.now();
                setElapsedSecs(Math.floor((now - activeSession.start_ts) / 1000));

                const remaining = Math.max(0, Math.floor((nextBreakTargetTs - now) / 1000));
                setNextBreakSecs(remaining);

                if (remaining === 0) {
                    const breakMins = activeSession.break_minutes ?? DEFAULT_BREAK_MINUTES;
                    setNextBreakTargetTs(now + breakMins * 60 * 1000);
                }

                // Detectar overtime en vivo
                const bedMins = activeSession.bedtime_minutes ?? DEFAULT_BEDTIME_MINUTES;
                const curMins = new Date().getHours() * 60 + new Date().getMinutes();
                const curAdj = curMins < 12 * 60 ? curMins + 1440 : curMins;
                const bedAdj = bedMins < 12 * 60 ? bedMins + 1440 : bedMins;
                setIsOvertime(curAdj > bedAdj);
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeSession, nextBreakTargetTs]);

    // ─── Acciones ────────────────────────────────────────────────────────────────

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
        const session: FocusSessionRow = {
            id,
            start_ts: Date.now(),
            break_minutes: breakMins,
            bedtime_minutes: bedMins,
        };
        setActiveSession(session);
        setElapsedSecs(0);
        setNextBreakSecs(breakMins * 60);
        setNextBreakTargetTs(Date.now() + breakMins * 60 * 1000);
        await ensureFocusNotifications(session);
    };

    const handleStop = async (reason: string) => {
        if (!activeSession) return;

        const bTime = activeSession.bedtime_minutes ?? DEFAULT_BEDTIME_MINUTES;
        const now = new Date();
        const cMins = now.getHours() * 60 + now.getMinutes();
        const cAdj = cMins < 12 * 60 ? cMins + 1440 : cMins;
        const bAdj = bTime < 12 * 60 ? bTime + 1440 : bTime;
        const over = Math.max(0, cAdj - bAdj);

        await closeFocusSession(activeSession.id, Date.now(), reason, over);
        if (timerRef.current) clearInterval(timerRef.current);

        // Cancelar solo las notificaciones de hiperfoco
        await Promise.all([
            Notifications.cancelScheduledNotificationAsync('focus-break').catch(() => { }),
            Notifications.cancelScheduledNotificationAsync('focus-bedtime').catch(() => { }),
            Notifications.cancelScheduledNotificationAsync('focus-bedtime+30').catch(() => { }),
            Notifications.cancelScheduledNotificationAsync('focus-bedtime+60').catch(() => { }),
        ]);

        if (over > 0) {
            Alert.alert(
                '⏱ Tiempo extra',
                `Estuviste ${over} minutos después de tu hora límite. Anótalo y descansa bien.`,
                [{ text: 'Entendido', onPress: () => router.back() }]
            );
        } else {
            setActiveSession(null);
            router.back();
        }
    };

    const handleExtend = async (extraMins: number) => {
        const newTarget = Date.now() + extraMins * 60 * 1000;
        setNextBreakSecs(extraMins * 60);
        setNextBreakTargetTs(newTarget);
        await scheduleBreakNotification(extraMins);
    };

    // ─── Utilidades ──────────────────────────────────────────────────────────────

    const formatSecs = (totalSecs: number) => {
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    // ─── Render: sin sesión ──────────────────────────────────────────────────────

    if (!activeSession) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
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

    // ─── Render: sesión activa ───────────────────────────────────────────────────

    return (
        <SafeAreaView style={[
            styles.safeActive,
            { backgroundColor: colors.bg },
            isOvertime && styles.safeOvertime
        ]}>
            <View style={styles.container}>
                {isOvertime && (
                    <View style={styles.overtimeBanner}>
                        <Text style={styles.overtimeText}>⚠️ Pasaste tu hora límite</Text>
                    </View>
                )}

                <Text style={styles.statusLabel}>Llevas en Hiperfoco:</Text>
                <Text style={styles.elapsedTime}>{formatSecs(elapsedSecs)}</Text>

                <View style={styles.breakCard}>
                    <Text style={styles.breakLabel}>Próximo corte suave en:</Text>
                    <Text style={styles.breakTime}>{formatSecs(nextBreakSecs)}</Text>
                </View>

                <View style={styles.actionsGrid}>
                    <Pressable
                        style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]}
                        onPress={() => Alert.alert('Pausa', 'Cierra los ojos 2 minutos. Mueve el cuerpo.')}
                    >
                        <Text style={styles.actionBtnText}>Pausa 2 min</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
                        onPress={() => handleExtend(25)}
                    >
                        <Text style={styles.actionBtnText}>Seguir 25 min</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                        onPress={() => handleStop('cierre')}
                    >
                        <Text style={styles.actionBtnText}>Cierre 10 min</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
                        onPress={() => handleStop('dormir')}
                    >
                        <Text style={styles.actionBtnText}>Terminar (Dormir)</Text>
                    </Pressable>
                </View>

                {isOvertime && (
                    <Pressable
                        style={styles.whatsappBtn}
                        onPress={() => {
                            const msg = encodeURIComponent(
                                '🆘 Sigo en hiperfoco. Necesito que me recuerdes dormir.'
                            );
                            Linking.openURL(`whatsapp://send?text=${msg}`).catch(() => {
                                Alert.alert('No se pudo abrir WhatsApp');
                            });
                        }}
                    >
                        <Text style={styles.whatsappBtnText}>📲 Pedir apoyo (WhatsApp)</Text>
                    </Pressable>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    safeActive: { flex: 1, backgroundColor: '#1e1b4b' },
    safeOvertime: { backgroundColor: '#3b0f0f' },
    container: { flex: 1, padding: 24, justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 16, color: '#0f172a' },
    subtitle: { fontSize: 16, textAlign: 'center', color: '#475569', marginBottom: 48 },
    startBtn: { backgroundColor: '#7c3aed', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
    startBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    cancelBtn: { paddingVertical: 18, alignItems: 'center' },
    cancelBtnText: { color: '#64748b', fontSize: 16, fontWeight: '600' },

    overtimeBanner: { backgroundColor: '#ef4444', padding: 12, borderRadius: 10, marginBottom: 16, alignItems: 'center' },
    overtimeText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    statusLabel: { color: '#c7d2fe', fontSize: 18, textAlign: 'center', marginBottom: 8 },
    elapsedTime: { color: '#fff', fontSize: 64, fontWeight: '800', textAlign: 'center', fontVariant: ['tabular-nums'], marginBottom: 48 },

    breakCard: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 16, marginBottom: 48, alignItems: 'center' },
    breakLabel: { color: '#a5b4fc', fontSize: 16, marginBottom: 8 },
    breakTime: { color: '#e0e7ff', fontSize: 32, fontWeight: '600', fontVariant: ['tabular-nums'] },

    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
    actionBtn: { width: '47%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

    whatsappBtn: { marginTop: 24, backgroundColor: '#25D366', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    whatsappBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
