import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPartnerTemplates } from '../src/db/partnerTemplates';
import { getLatestCheckIn } from '../src/db/checkins';
import type { SemaphoreResult } from '../src/db/initDb';

export default function PedirApoyoScreen() {
  const [pedidos, setPedidos] = useState<{ id: number; texto: string }[]>([]);
  const [acciones, setAcciones] = useState<{ id: number; texto: string }[]>([]);
  const [estado, setEstado] = useState<SemaphoreResult>('AMARILLO');
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null);
  const [selectedAcciones, setSelectedAcciones] = useState<string[]>([]);

  useEffect(() => {
    getPartnerTemplates().then((list) => {
      setPedidos(list.filter((t) => t.tipo === 'pedido').map((t) => ({ id: t.id, texto: t.texto })));
      setAcciones(list.filter((t) => t.tipo === 'accion').map((t) => ({ id: t.id, texto: t.texto })));
    });
    getLatestCheckIn().then((c) => {
      if (c) setEstado(c.semaforo_resultado);
    });
  }, []);

  const toggleAccion = (texto: string) => {
    setSelectedAcciones((prev) =>
      prev.includes(texto) ? prev.filter((t) => t !== texto) : prev.length >= 2 ? prev : [...prev, texto]
    );
  };

  const mensaje =
    estado &&
    selectedPedido &&
    `Estado: ${estado}. Necesito: ${selectedPedido}. Por favor: ${selectedAcciones[0] ?? '-'}. ${selectedAcciones[1] ?? ''}.`;

  const handleShare = async () => {
    if (!mensaje) return;
    const text = encodeURIComponent(mensaje);
    const url = Platform.OS === 'web'
      ? `https://wa.me/?text=${text}`
      : `whatsapp://send?text=${text}`;

    try {
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
      } else {
        await Clipboard.setStringAsync(mensaje);
        Alert.alert('Copiado', 'No se pudo abrir WhatsApp. El mensaje se ha copiado al portapapeles.');
      }
    } catch {
      await Clipboard.setStringAsync(mensaje);
      Alert.alert('Copiado', 'Mensaje copiado al portapapeles.');
    }
  };

  const handleCopy = async () => {
    if (!mensaje) return;
    await Clipboard.setStringAsync(mensaje);
    Alert.alert('Copiado', 'Mensaje copiado al portapapeles.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Pedir apoyo</Text>
        <Text style={styles.label}>Estado</Text>
        <View style={styles.estadoRow}>
          {(['VERDE', 'AMARILLO', 'ROJO'] as const).map((e) => (
            <Pressable
              key={e}
              style={[styles.estadoBtn, estado === e && styles.estadoBtnActive]}
              onPress={() => setEstado(e)}
            >
              <Text style={[styles.estadoBtnText, estado === e && styles.estadoBtnTextActive]}>{e}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Pedido (elige 1)</Text>
        {pedidos.map((p) => (
          <Pressable
            key={p.id}
            style={[styles.card, selectedPedido === p.texto && styles.cardSelected]}
            onPress={() => setSelectedPedido(p.texto)}
          >
            <Text style={styles.cardText}>{p.texto}</Text>
          </Pressable>
        ))}
        <Text style={styles.label}>Acciones sugeridas (hasta 2)</Text>
        {acciones.map((a) => (
          <Pressable
            key={a.id}
            style={[styles.card, selectedAcciones.includes(a.texto) && styles.cardSelected]}
            onPress={() => toggleAccion(a.texto)}
          >
            <Text style={styles.cardText}>{a.texto}</Text>
          </Pressable>
        ))}
        <Text style={styles.label}>Mensaje</Text>
        <View style={styles.preview}>
          <Text style={styles.previewText}>{mensaje ?? 'Selecciona estado y pedido.'}</Text>
        </View>
        <Pressable
          style={[styles.btn, !mensaje && styles.btnDisabled]}
          onPress={handleShare}
          disabled={!mensaje}
        >
          <Text style={styles.btnText}>Enviar por WhatsApp</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnSec, !mensaje && styles.btnDisabled]}
          onPress={handleCopy}
          disabled={!mensaje}
        >
          <Text style={styles.btnTextSec}>Copiar mensaje</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8, color: '#334155' },
  estadoRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  estadoBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  estadoBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  estadoBtnText: { fontSize: 14, color: '#64748b' },
  estadoBtnTextActive: { color: '#fff' },
  card: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  cardSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  cardText: { fontSize: 15 },
  preview: {
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginBottom: 16,
  },
  previewText: { fontSize: 14, color: '#334155' },
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
});
