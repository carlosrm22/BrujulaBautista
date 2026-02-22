import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InfoTipProps {
    title: string;
    description: string;
}

export function InfoTip({ title, description }: InfoTipProps) {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <Pressable onPress={() => setVisible(true)} hitSlop={8}>
                <Ionicons name="information-circle-outline" size={20} color="#94a3b8" />
            </Pressable>
            <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
                <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
                    <View style={styles.card}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.desc}>{description}</Text>
                        <Pressable style={styles.closeBtn} onPress={() => setVisible(false)}>
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
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    title: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
    desc: { fontSize: 14, color: '#475569', lineHeight: 20 },
    closeBtn: {
        marginTop: 16,
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#7c3aed',
        borderRadius: 8,
    },
    closeText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
