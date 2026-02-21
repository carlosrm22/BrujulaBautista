import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPartnerTemplates, updatePartnerTemplate } from '../../src/db/partnerTemplates';

export default function PlantillasScreen() {
  const [items, setItems] = useState<{ id: number; tipo: string; texto: string }[]>([]);

  useEffect(() => {
    getPartnerTemplates().then((list) =>
      setItems(list.map((t) => ({ id: t.id, tipo: t.tipo, texto: t.texto })))
    );
  }, []);

  const updateText = (id: number, texto: string) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, texto } : t)));
  };

  const save = async (id: number) => {
    const item = items.find((t) => t.id === id);
    if (item) await updatePartnerTemplate(id, item.texto);
  };

  const pedidos = items.filter((t) => t.tipo === 'pedido');
  const acciones = items.filter((t) => t.tipo === 'accion');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>Atrás</Text>
        </Pressable>
        <Text style={styles.title}>Plantillas WhatsApp</Text>
        <Text style={styles.sectionTitle}>Pedidos</Text>
        {pedidos.map((p) => (
          <View key={p.id} style={styles.row}>
            <TextInput
              style={styles.input}
              value={p.texto}
              onChangeText={(t) => updateText(p.id, t)}
              onBlur={() => save(p.id)}
            />
          </View>
        ))}
        <Text style={styles.sectionTitle}>Acciones sugeridas</Text>
        {acciones.map((a) => (
          <View key={a.id} style={styles.row}>
            <TextInput
              style={styles.input}
              value={a.texto}
              onChangeText={(t) => updateText(a.id, t)}
              onBlur={() => save(a.id)}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  back: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#2563eb' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  row: { marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
