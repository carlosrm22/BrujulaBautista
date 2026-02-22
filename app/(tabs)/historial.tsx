import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
    getAllCheckIns,
    getCheckInStats,
    deleteCheckIn,
    type CheckInWithTime,
    type CheckInStats,
} from '../../src/db/checkins';
import { getCompletedTasks, deleteTask as dbDeleteTask } from '../../src/db/tasks';
import { getSocialLogs, deleteSocialLog as dbDeleteSocialLog } from '../../src/db/socialLogs';
import type { TaskRow, SocialLogRow, FocusSessionRow } from '../../src/db/initDb.native';
import { getFocusSessionsHistory } from '../../src/db/focusSessions';
import { useTheme } from '../../src/context/ThemeContext';

type Period = '7d' | '30d' | 'all';

function periodToRange(period: Period): { from?: number; to?: number } {
    if (period === 'all') return {};
    const now = Date.now();
    const days = period === '7d' ? 7 : 30;
    return { from: now - days * 86_400_000, to: now };
}

function formatDate(ts: number): string {
    const d = new Date(ts);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${mins}`;
}

const SEMAFORO_COLORS: Record<string, string> = {
    VERDE: '#22c55e',
    AMARILLO: '#eab308',
    ROJO: '#ef4444',
};

export default function HistorialScreen() {
    const { colors } = useTheme();
    const [tab, setTab] = useState<'checkins' | 'tareas' | 'social' | 'hiperfoco'>('checkins');
    const [period, setPeriod] = useState<Period>('7d');
    const [entries, setEntries] = useState<CheckInWithTime[]>([]);
    const [stats, setStats] = useState<CheckInStats | null>(null);
    const [tasks, setTasks] = useState<TaskRow[]>([]);
    const [socialLogs, setSocialLogs] = useState<SocialLogRow[]>([]);
    const [focusSessions, setFocusSessions] = useState<FocusSessionRow[]>([]);

    const loadData = useCallback(async () => {
        const range = periodToRange(period);
        const [allEntries, allStats, lastTasks, lastSocial, sessions] = await Promise.all([
            getAllCheckIns(200),
            getCheckInStats(range.from, range.to),
            getCompletedTasks(),
            getSocialLogs(),
            getFocusSessionsHistory(100),
        ]);

        if (range.from && range.to) {
            setEntries(allEntries.filter((e) => e.timestamp >= range.from! && e.timestamp <= range.to!));
        } else {
            setEntries(allEntries);
        }
        setStats(allStats);
        setTasks(lastTasks);
        setSocialLogs(lastSocial);
        setFocusSessions(sessions);
    }, [period]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleDelete = (id: number) => {
        Alert.alert(
            "Borrar registro",
            "¿Estás seguro de que quieres borrar este check-in?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Borrar",
                    style: "destructive",
                    onPress: async () => {
                        await deleteCheckIn(id);
                        loadData();
                    }
                }
            ]
        );
    };

    const handleDeleteTask = (id: number) => {
        Alert.alert(
            "Borrar tarea",
            "¿Estás seguro de que quieres borrar esta tarea del historial?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Borrar",
                    style: "destructive",
                    onPress: async () => {
                        await dbDeleteTask(id);
                        loadData();
                    }
                }
            ]
        );
    };

    const handleDeleteSocial = (id: number) => {
        Alert.alert(
            "Borrar registro social",
            "¿Seguro que deseas borrar este registro?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Borrar",
                    style: "destructive",
                    onPress: async () => {
                        await dbDeleteSocialLog(id);
                        loadData();
                    }
                }
            ]
        );
    };

    const totalSemaforo = stats ? stats.countVerde + stats.countAmarillo + stats.countRojo : 0;
    const taskStats = {
        total: tasks.length,
        avgEst: tasks.length ? Math.round(tasks.reduce((acc, t) => acc + t.tiempo_min, 0) / tasks.length) : 0,
        avgReal: tasks.length ? Math.round(tasks.reduce((acc, t) => acc + (t.tiempo_dedicado || 0), 0) / tasks.length) : 0,
    };

    const afterLogs = socialLogs.filter(s => s.fase === 'despues');
    const socialStats = {
        total: socialLogs.length,
        avgCostoSocial: afterLogs.length ? (afterLogs.reduce((acc, s) => acc + (s.costo_social || 0), 0) / afterLogs.length).toFixed(1) : 0,
        avgCostoSensorial: afterLogs.length ? (afterLogs.reduce((acc, s) => acc + (s.costo_sensorial || 0), 0) / afterLogs.length).toFixed(1) : 0,
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.title, { color: colors.text }]}>Historial</Text>

                <View style={styles.topTabs}>
                    <Pressable style={[styles.topTab, tab === 'checkins' && styles.topTabActive]} onPress={() => setTab('checkins')}>
                        <Text style={[styles.topTabText, tab === 'checkins' && styles.topTabTextActive]}>Check-ins</Text>
                    </Pressable>
                    <Pressable style={[styles.topTab, tab === 'tareas' && styles.topTabActive]} onPress={() => setTab('tareas')}>
                        <Text style={[styles.topTabText, tab === 'tareas' && styles.topTabTextActive]}>Tareas</Text>
                    </Pressable>
                    <Pressable style={[styles.topTab, tab === 'social' && styles.topTabActive]} onPress={() => setTab('social')}>
                        <Text style={[styles.topTabText, tab === 'social' && styles.topTabTextActive]}>Social</Text>
                    </Pressable>
                    <Pressable style={[styles.topTab, tab === 'hiperfoco' && styles.topTabActive]} onPress={() => setTab('hiperfoco')}>
                        <Text style={[styles.topTabText, tab === 'hiperfoco' && styles.topTabTextActive]}>🧠 Foco</Text>
                    </Pressable>
                </View>

                {tab === 'checkins' ? (
                    <>
                        <View style={styles.periodRow}>
                            {(['7d', '30d', 'all'] as Period[]).map((p) => (
                                <Pressable
                                    key={p}
                                    style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                                    onPress={() => setPeriod(p)}
                                >
                                    <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                                        {p === '7d' ? '7 días' : p === '30d' ? '30 días' : 'Todo'}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        {/* Stats cards */}
                        {stats && stats.total > 0 ? (
                            <>
                                <Text style={styles.sectionTitle}>Resumen</Text>
                                <View style={styles.statsGrid}>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statNumber}>{stats.total}</Text>
                                        <Text style={styles.statLabel}>Check-ins</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statNumber}>{stats.avgEnergia}</Text>
                                        <Text style={styles.statLabel}>Energía prom.</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statNumber}>{stats.avgSensorial}</Text>
                                        <Text style={styles.statLabel}>Sensorial prom.</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statNumber}>{stats.avgSocial}</Text>
                                        <Text style={styles.statLabel}>Social prom.</Text>
                                    </View>
                                </View>

                                {/* Semáforo distribution */}
                                <Text style={styles.sectionTitle}>Distribución semáforo</Text>
                                <View style={styles.barContainer}>
                                    {totalSemaforo > 0 && (
                                        <View style={styles.barRow}>
                                            {stats.countVerde > 0 && (
                                                <View
                                                    style={[
                                                        styles.barSegment,
                                                        {
                                                            backgroundColor: SEMAFORO_COLORS.VERDE,
                                                            flex: stats.countVerde / totalSemaforo,
                                                        },
                                                    ]}
                                                >
                                                    <Text style={styles.barText}>{stats.countVerde}</Text>
                                                </View>
                                            )}
                                            {stats.countAmarillo > 0 && (
                                                <View
                                                    style={[
                                                        styles.barSegment,
                                                        {
                                                            backgroundColor: SEMAFORO_COLORS.AMARILLO,
                                                            flex: stats.countAmarillo / totalSemaforo,
                                                        },
                                                    ]}
                                                >
                                                    <Text style={styles.barText}>{stats.countAmarillo}</Text>
                                                </View>
                                            )}
                                            {stats.countRojo > 0 && (
                                                <View
                                                    style={[
                                                        styles.barSegment,
                                                        {
                                                            backgroundColor: SEMAFORO_COLORS.ROJO,
                                                            flex: stats.countRojo / totalSemaforo,
                                                        },
                                                    ]}
                                                >
                                                    <Text style={styles.barText}>{stats.countRojo}</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                    <View style={styles.legendRow}>
                                        <View style={styles.legendItem}>
                                            <View style={[styles.legendDot, { backgroundColor: SEMAFORO_COLORS.VERDE }]} />
                                            <Text style={styles.legendText}>Verde</Text>
                                        </View>
                                        <View style={styles.legendItem}>
                                            <View style={[styles.legendDot, { backgroundColor: SEMAFORO_COLORS.AMARILLO }]} />
                                            <Text style={styles.legendText}>Amarillo</Text>
                                        </View>
                                        <View style={styles.legendItem}>
                                            <View style={[styles.legendDot, { backgroundColor: SEMAFORO_COLORS.ROJO }]} />
                                            <Text style={styles.legendText}>Rojo</Text>
                                        </View>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>
                                    Aún no hay check-ins{period !== 'all' ? ' en este período' : ''}. Usa la pestaña Estado para registrar cómo te sientes.
                                </Text>
                            </View>
                        )}

                        {/* Entry list */}
                        {entries.length > 0 && (
                            <>
                                <Text style={styles.sectionTitle}>Entradas recientes</Text>
                                {entries.map((item) => (
                                    <View key={item.id} style={styles.entryCard}>
                                        <View style={styles.entryHeader}>
                                            <View
                                                style={[
                                                    styles.entryDot,
                                                    { backgroundColor: SEMAFORO_COLORS[item.semaforo_resultado] ?? '#94a3b8' },
                                                ]}
                                            />
                                            <Text style={styles.entryDate}>{formatDate(item.timestamp)}</Text>
                                            <Text style={styles.entrySemaforo}>{item.semaforo_resultado}</Text>
                                            <Pressable onPress={() => handleDelete(item.id)} hitSlop={10} style={{ padding: 4 }}>
                                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                            </Pressable>
                                        </View>
                                        <View style={styles.entryValues}>
                                            <Text style={styles.entryVal}>⚡{item.energia_fisica}</Text>
                                            <Text style={styles.entryVal}>👁{item.carga_sensorial}</Text>
                                            <Text style={styles.entryVal}>👥{item.carga_social}</Text>
                                            <Text style={styles.entryVal}>❓{item.ambiguedad}</Text>
                                            <Text style={styles.entryVal}>🔥{item.ira}</Text>
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}
                    </>
                ) : tab === 'tareas' ? (
                    <View>
                        <Text style={styles.sectionTitle}>Tareas completadas</Text>

                        {tasks.length > 0 && (
                            <View style={[styles.statsGrid, { marginBottom: 16 }]}>
                                <View style={styles.statCard}>
                                    <Text style={styles.statNumber}>{taskStats.total}</Text>
                                    <Text style={styles.statLabel}>Total</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statNumber}>{taskStats.avgEst}m</Text>
                                    <Text style={styles.statLabel}>Prom. Est.</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statNumber}>{taskStats.avgReal}m</Text>
                                    <Text style={styles.statLabel}>Prom. Real</Text>
                                </View>
                            </View>
                        )}

                        {tasks.length > 0 ? tasks.map(t => (
                            <View key={t.id} style={styles.taskCard}>
                                <View style={styles.taskHeader}>
                                    <Text style={styles.taskTitle}>{t.titulo}</Text>
                                    <Text style={styles.taskDate}>{formatDate(t.completed_at || t.created_at)}</Text>
                                    <Pressable onPress={() => handleDeleteTask(t.id)} hitSlop={10} style={{ padding: 4 }}>
                                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                    </Pressable>
                                </View>
                                <Text style={styles.taskTime}>Est: {t.tiempo_min} min  |  Real: {t.tiempo_dedicado} min</Text>
                            </View>
                        )) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No hay tareas terminadas aún.</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View>
                        <Text style={styles.sectionTitle}>Registros sociales</Text>

                        {socialLogs.length > 0 && (
                            <View style={[styles.statsGrid, { marginBottom: 16 }]}>
                                <View style={styles.statCard}>
                                    <Text style={styles.statNumber}>{socialStats.total}</Text>
                                    <Text style={styles.statLabel}>Registros</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statNumber}>{socialStats.avgCostoSocial}</Text>
                                    <Text style={styles.statLabel}>Costo Social Prom.</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statNumber}>{socialStats.avgCostoSensorial}</Text>
                                    <Text style={styles.statLabel}>Costo Sensorial Prom.</Text>
                                </View>
                            </View>
                        )}

                        {socialLogs.length > 0 ? socialLogs.map(s => (
                            <View key={s.id} style={styles.taskCard}>
                                <View style={styles.taskHeader}>
                                    <Text style={styles.taskTitle}>Fase: {s.fase === 'antes' ? 'Preparación' : 'Recuperación'}</Text>
                                    <Text style={styles.taskDate}>{formatDate(s.timestamp)}</Text>
                                    <Pressable onPress={() => handleDeleteSocial(s.id)} hitSlop={10} style={{ padding: 4 }}>
                                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                    </Pressable>
                                </View>
                                {s.fase === 'antes' ? (
                                    <>
                                        {s.duracion && <Text style={styles.taskTime}>Duración: {s.duracion}</Text>}
                                        {s.riesgo_sensorial && <Text style={styles.taskTime}>Riesgo: {s.riesgo_sensorial}</Text>}
                                        <Text style={styles.taskTime}>Tapones: {s.llevar_tapones ? 'Sí' : 'No'}</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.taskTime}>Costo Social: {s.costo_social}/10</Text>
                                        <Text style={styles.taskTime}>Costo Sensorial: {s.costo_sensorial}/10</Text>
                                    </>
                                )}
                            </View>
                        )) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No hay registros sociales aún.</Text>
                            </View>
                        )}
                    </View>
                )}

                {tab === 'hiperfoco' && (() => {
                    const totalSessions = focusSessions.length;
                    const totalOvertime = focusSessions.reduce((acc, s) => acc + (s.over_bedtime_minutes || 0), 0);
                    const sessionsWithDuration = focusSessions.filter(s => s.end_ts && s.start_ts);
                    const avgDurationMins = sessionsWithDuration.length
                        ? Math.round(sessionsWithDuration.reduce((acc, s) => acc + Math.floor(((s.end_ts || 0) - s.start_ts) / 60000), 0) / sessionsWithDuration.length)
                        : 0;

                    const reasonLabel: Record<string, string> = {
                        cierre: '✅ Cierre planificado',
                        dormir: '🛌 A dormir',
                    };

                    return (
                        <View>
                            {totalSessions === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>
                                        No hay sesiones de hiperfoco registradas aún.{`\n`}Inicia una desde la pantalla de Estado.
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    {/* Estadísticas resumen */}
                                    <Text style={styles.sectionTitle}>Resumen</Text>
                                    <View style={styles.statsGrid}>
                                        <View style={styles.statCard}>
                                            <Text style={styles.statNumber}>{totalSessions}</Text>
                                            <Text style={styles.statLabel}>Sesiones</Text>
                                        </View>
                                        <View style={styles.statCard}>
                                            <Text style={styles.statNumber}>{avgDurationMins}m</Text>
                                            <Text style={styles.statLabel}>Duración prom.</Text>
                                        </View>
                                        <View style={styles.statCard}>
                                            <Text style={[styles.statNumber, totalOvertime > 0 && { color: '#ef4444' }]}>
                                                {totalOvertime}m
                                            </Text>
                                            <Text style={styles.statLabel}>Overtime total</Text>
                                        </View>
                                    </View>

                                    {/* Lista de sesiones */}
                                    <Text style={styles.sectionTitle}>Sesiones</Text>
                                    {focusSessions.map((s) => {
                                        const durationMins = s.end_ts
                                            ? Math.floor((s.end_ts - s.start_ts) / 60000)
                                            : null;
                                        const hasOvertime = (s.over_bedtime_minutes || 0) > 0;

                                        return (
                                            <View key={s.id} style={[
                                                styles.focusCard,
                                                hasOvertime && styles.focusCardOvertime,
                                            ]}>
                                                <View style={styles.focusCardHeader}>
                                                    <Text style={styles.focusCardDate}>
                                                        {formatDate(s.start_ts)}
                                                    </Text>
                                                    {durationMins !== null && (
                                                        <Text style={styles.focusCardDuration}>
                                                            {durationMins >= 60
                                                                ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
                                                                : `${durationMins}m`}
                                                        </Text>
                                                    )}
                                                </View>
                                                <View style={styles.focusCardBody}>
                                                    {s.break_minutes && (
                                                        <Text style={styles.focusCardMeta}>⏱ Cortes c/{s.break_minutes}min</Text>
                                                    )}
                                                    {s.ended_reason && (
                                                        <Text style={styles.focusCardMeta}>
                                                            {reasonLabel[s.ended_reason] ?? s.ended_reason}
                                                        </Text>
                                                    )}
                                                    {hasOvertime && (
                                                        <Text style={styles.focusCardOverread}>
                                                            ⚠️ +{s.over_bedtime_minutes}min extra
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </>
                            )}
                        </View>
                    );
                })()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 32 },
    title: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#334155', marginTop: 20, marginBottom: 8 },

    // Period buttons
    periodRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    periodBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#e2e8f0',
    },
    periodBtnActive: { backgroundColor: '#7c3aed' },
    periodText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
    periodTextActive: { color: '#fff' },

    // Stats grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    statNumber: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
    statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },

    // Semáforo bar
    barContainer: { marginTop: 4 },
    barRow: {
        flexDirection: 'row',
        height: 32,
        borderRadius: 8,
        overflow: 'hidden',
        gap: 2,
    },
    barSegment: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
    barText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    legendRow: { flexDirection: 'row', gap: 16, marginTop: 8, justifyContent: 'center' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: '#64748b' },

    // Empty state
    emptyState: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        marginTop: 16,
    },
    emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },

    // Entry cards
    entryCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    entryDot: { width: 12, height: 12, borderRadius: 6 },
    entryDate: { fontSize: 14, fontWeight: '500', color: '#334155', flex: 1 },
    entrySemaforo: { fontSize: 12, fontWeight: '600', color: '#64748b' },
    entryValues: { flexDirection: 'row', gap: 12, paddingLeft: 20 },
    entryVal: { fontSize: 13, color: '#64748b' },

    // Top Tabs
    topTabs: { flexDirection: 'row', padding: 4, backgroundColor: '#e2e8f0', borderRadius: 8, marginBottom: 16 },
    topTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
    topTabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 1 },
    topTabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    topTabTextActive: { color: '#0f172a' },

    // Tasks list
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    taskHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    taskTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 },
    taskDate: { fontSize: 13, color: '#64748b', marginRight: 12 },
    taskTime: { fontSize: 14, color: '#334155' },

    // Focus session cards
    focusCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 14,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#7c3aed',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    focusCardOvertime: { borderLeftColor: '#ef4444' },
    focusCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    focusCardDate: { fontSize: 14, fontWeight: '600', color: '#334155' },
    focusCardDuration: { fontSize: 14, fontWeight: '700', color: '#7c3aed' },
    focusCardBody: { gap: 2 },
    focusCardMeta: { fontSize: 13, color: '#64748b' },
    focusCardOverread: { fontSize: 13, fontWeight: '600', color: '#ef4444', marginTop: 2 },
});

