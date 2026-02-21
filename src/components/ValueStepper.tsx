import { View, Text, StyleSheet, Pressable } from 'react-native';
import { InfoTip } from './InfoTip';

interface ValueStepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  info?: string;
  onValueChange: (n: number) => void;
}

export function ValueStepper({
  label,
  value,
  min = 0,
  max = 10,
  info,
  onValueChange,
}: ValueStepperProps) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelWithInfo}>
          <Text style={styles.label}>{label}</Text>
          {info && <InfoTip title={label} description={info} />}
        </View>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.controls}>
        <Pressable
          style={[styles.btn, !canDecrease && styles.btnDisabled]}
          onPress={() => canDecrease && onValueChange(value - 1)}
          disabled={!canDecrease}
        >
          <Text style={[styles.btnText, !canDecrease && styles.btnTextDisabled]}>−</Text>
        </Pressable>
        <View style={styles.valueBox}>
          <Text style={styles.valueBig}>{value}</Text>
        </View>
        <Pressable
          style={[styles.btn, !canIncrease && styles.btnDisabled]}
          onPress={() => canIncrease && onValueChange(value + 1)}
          disabled={!canIncrease}
        >
          <Text style={[styles.btnText, !canIncrease && styles.btnTextDisabled]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  labelWithInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 14, color: '#334155' },
  value: { fontSize: 14, fontWeight: '600', minWidth: 24, textAlign: 'right' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#cbd5e1', opacity: 0.8 },
  btnText: { fontSize: 24, fontWeight: '600', color: '#fff' },
  btnTextDisabled: { color: '#64748b' },
  valueBox: { flex: 1, alignItems: 'center' },
  valueBig: { fontSize: 18, fontWeight: '700' },
});

