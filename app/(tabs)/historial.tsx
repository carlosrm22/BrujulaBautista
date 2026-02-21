import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    getAllCheckIns,
    getCheckInStats,
    type CheckInWithTime,
    type CheckInStats,
} from '../../src/db/checkins';

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
    const [period, setPeriod] = useState<Period>('7d');
    const [entries, setEntries] = useState<CheckInWithTime[]>([]);
    const [stats, setStats] = useState<CheckInStats | null>(null);

    const loadData = useCallback(async () => {
        const range = periodToRange(period);
        const [allEntries, allStats] = await Promise.all([
            getAllCheckIns(200),
            getCheckInStats(range.from, range.to),
        ]);

        if (range.from && range.to) {
            setEntries(allEntries.filter((e) => e.timestamp >= range.from! && e.timestamp <= range.to!));
        } else {
            setEntries(allEntries);
        }
        setStats(allStats);
    }, [period]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const totalSemaforo = stats ? stats.countVerde + stats.countAmarillo + stats.countRojo : 0;

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Historial</Text>

                {/* Period selector */}
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
    periodRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    periodBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#e2e8f0',
    },
    periodBtnActive: { backgroundColor: '#2563eb' },
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
});
