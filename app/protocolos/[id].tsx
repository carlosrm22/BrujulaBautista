import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProtocolById } from '../../src/db/protocols';
import { useTheme } from '../src/context/ThemeContext';

export default function ProtocoloDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [nombre, setNombre] = useState('');
  const [pasos, setPasos] = useState<string[]>([]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!id) return;
    getProtocolById(Number(id)).then((p) => {
      if (p) {
        setNombre(p.nombre);
        setPasos(p.pasos);
      }
    });
  }, [id]);

  useEffect(() => {
    if (nombre) navigation.setOptions({ title: nombre });
  }, [nombre, navigation]);

  const toggleCheck = (index: number) => {
    setChecked((c) => ({ ...c, [index]: !c[index] }));
  };

  const handlePedirApoyo = () => {
    router.push('/pedir-apoyo');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>{nombre}</Text>
        {pasos.map((paso, index) => (
          <Pressable key={index} style={styles.stepRow} onPress={() => toggleCheck(index)}>
            <View style={[styles.checkbox, { borderColor: colors.border }, checked[index] && styles.checkboxChecked]} />
            <Text style={[styles.stepText, { color: colors.text }, checked[index] && styles.stepDone]}>{paso}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.btn} onPress={handlePedirApoyo}>
          <Text style={styles.btnText}>Pedir apoyo (WhatsApp)</Text>
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
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#64748b',
    borderRadius: 4,
    marginRight: 12,
  },
  checkboxChecked: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  stepText: { fontSize: 16, flex: 1 },
  stepDone: { textDecorationLine: 'line-through', color: '#64748b' },
  btn: {
    minHeight: 48,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
