import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface InfoTipProps {
    title: string;
    description: string;
}

export function InfoTip({ title, description }: InfoTipProps) {
    const { colors } = useTheme();
    const [visible, setVisible] = useState(false);

    return (
        <>
            <Pressable onPress={() => setVisible(true)} hitSlop={8}>
                <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
            </Pressable>
            <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
                <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
                    <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
                        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                        <Text style={[styles.desc, { color: colors.textSecond }]}>{description}</Text>
                        <Pressable style={[styles.closeBtn, { backgroundColor: colors.primary }]} onPress={() => setVisible(false)}>
                            <Text style={styles.closeText}>Entendido</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    title: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
    desc: { fontSize: 14, lineHeight: 20 },
    closeBtn: {
        marginTop: 16,
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    closeText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
