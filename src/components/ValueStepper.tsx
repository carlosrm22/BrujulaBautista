import { View, Text, StyleSheet, Pressable } from 'react-native';
import { InfoTip } from './InfoTip';
import { useTheme } from '../context/ThemeContext';

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
  const { colors } = useTheme();
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelWithInfo}>
          <Text style={[styles.label, { color: colors.textSecond }]}>{label}</Text>
          {info && <InfoTip title={label} description={info} />}
        </View>
        <Text style={[styles.value, { color: colors.textSecond }]}>{value}</Text>
      </View>
      <View style={styles.controls}>
        <Pressable
          style={[styles.btn, { backgroundColor: canDecrease ? colors.primary : colors.border }]}
          onPress={() => canDecrease && onValueChange(value - 1)}
          disabled={!canDecrease}
        >
          <Text style={[styles.btnText, { color: canDecrease ? '#fff' : colors.textMuted }]}>−</Text>
        </Pressable>
        <View style={[styles.valueBox, { backgroundColor: colors.bgMuted, borderRadius: 10 }]}>
          <Text style={[styles.valueBig, { color: colors.text }]}>{value}</Text>
        </View>
        <Pressable
          style={[styles.btn, { backgroundColor: canIncrease ? colors.primary : colors.border }]}
          onPress={() => canIncrease && onValueChange(value + 1)}
          disabled={!canIncrease}
        >
          <Text style={[styles.btnText, { color: canIncrease ? '#fff' : colors.textMuted }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  labelWithInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '600', minWidth: 24, textAlign: 'right' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: { fontSize: 24, fontWeight: '600' },
  valueBox: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  valueBig: { fontSize: 18, fontWeight: '700' },
});
