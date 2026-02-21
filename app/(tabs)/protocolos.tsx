import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllProtocols } from '../../src/db/protocols';
import type { Protocol } from '../../src/db/protocols';

export default function ProtocolosScreen() {
  const [list, setList] = useState<Protocol[]>([]);

  useEffect(() => {
    getAllProtocols().then(setList);
  }, []);

  const renderItem = ({ item }: { item: Protocol }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/protocolos/[id]', params: { id: String(item.id) } })}
    >
      <Text style={styles.cardTitle}>{item.nombre}</Text>
      <Text style={styles.cardSub}>{item.pasos.length} pasos</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Protocolos</Text>
      </View>
      <FlatList
        data={list}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 16 },
  title: { fontSize: 24, fontWeight: '600' },
  list: { padding: 16, paddingTop: 8 },
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#64748b' },
});
