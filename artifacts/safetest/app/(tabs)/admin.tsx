import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeTest } from '@/context/SafeTestContext';
import { GhostButton, Screen, SectionTitle, StatusPill, TestRow } from '@/components/SafeTestUI';
import { useColors } from '@/hooks/useColors';

export default function AdminScreen() {
  const colors = useColors();
  const { user, kits, auditLogs, tests } = useSafeTest();
  return <Screen scroll><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><Text style={[styles.eyebrow, { color: colors.primary }]}>ORGANIZATION CONTROL</Text><Text style={[styles.title, { color: colors.foreground }]}>Admin workspace</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Manage access, kit readiness, and the audit trail for {user?.organizationName}.</Text><View style={styles.actionGrid}><AdminAction icon="users" label="Users" detail="4 active members" onPress={() => Alert.alert('Users', 'Invite, disable, and change roles in the connected admin console.')}/><AdminAction icon="package" label="Test kits" detail={`${kits.filter((kit) => kit.enabled).length} enabled profiles`} onPress={() => Alert.alert('Test kits', 'Kit profiles are versioned and expired kits cannot be selected.')}/><AdminAction icon="briefcase" label="Organization" detail="Northstar workspace" onPress={() => Alert.alert('Organization settings', 'Organization isolation is enforced for every record.')}/><AdminAction icon="file-text" label="Audit logs" detail={`${auditLogs.length} recent local events`} onPress={() => Alert.alert('Audit logs', 'Exports are limited to authorized admins and omit sensitive values.')}/></View><SectionTitle eyebrow="KIT READINESS" title="Available profiles" />{kits.map((kit) => <View key={kit.id} style={[styles.kitRow, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.kitIcon, { backgroundColor: kit.enabled ? '#e4f4ed' : '#fce9e9' }]}><Feather name="package" size={18} color={kit.enabled ? '#146b4c' : colors.destructive} /></View><View style={styles.kitCopy}><Text style={[styles.kitName, { color: colors.foreground }]}>{kit.name}</Text><Text style={[styles.kitMeta, { color: colors.mutedForeground }]}>{kit.manufacturer} · {kit.version} · Expires {kit.expiresAt}</Text></View><StatusPill label={kit.enabled ? 'Enabled' : 'Disabled'} tone={kit.enabled ? 'green' : 'red'} /></View>)}<SectionTitle eyebrow="RECENT AUDIT" title="Activity" />{tests.slice(0, 4).map((test) => <TestRow key={test.id} test={test} onPress={() => Alert.alert('Audit trail', `Reference ${test.testReference} is scoped to this organization.`)} />)}<GhostButton label="Export authorized logs" icon="download" onPress={() => Alert.alert('Export ready', 'A sanitized audit export would be generated here for authorized admins.')} /></ScrollView></Screen>;
}

function AdminAction({ icon, label, detail, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; detail: string; onPress: () => void }) {
  const colors = useColors();
  return <GhostButton label={`${label} · ${detail}`} icon={icon} onPress={onPress} style={{ width: '48%', minHeight: 66, justifyContent: 'flex-start', paddingHorizontal: 12 }} />;
}

const styles = StyleSheet.create({
  content: { paddingTop: 4, paddingBottom: 24, gap: 13 },
  eyebrow: { fontSize: 11, letterSpacing: 1.2, fontWeight: '700', marginBottom: 1 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.7 },
  subtitle: { fontSize: 14, lineHeight: 21, marginBottom: 7 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  kitRow: { minHeight: 68, borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  kitIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kitCopy: { flex: 1, gap: 3 },
  kitName: { fontSize: 13, fontWeight: '700' },
  kitMeta: { fontSize: 11 },
});