import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeTest } from '@/context/SafeTestContext';
import { BrandLockup, Notice, Screen, SectionTitle, StatCard, StatusPill, TestRow } from '@/components/SafeTestUI';
import { useColors } from '@/hooks/useColors';

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, tests, isOnline, demoMode } = useSafeTest();
  const pending = tests.filter((test) => ['submitted', 'under_review'].includes(test.status)).length;
  const inconclusive = tests.filter((test) => test.status === 'inconclusive' || test.overallResult === 'inconclusive').length;
  const completedToday = tests.filter((test) => test.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  return <Screen scroll><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <View style={styles.header}><View><Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good morning,</Text><Text style={[styles.name, { color: colors.foreground }]}>{user?.name.split(' ')[0] ?? 'Drug Lense'}</Text></View><View style={styles.headerRight}><View style={[styles.onlineDot, { backgroundColor: isOnline ? '#2c9b6a' : '#c78b28' }]} /><Text style={[styles.onlineText, { color: colors.mutedForeground }]}>{isOnline ? 'Online' : 'Offline'}</Text></View></View>
    <View style={styles.brandLine}><BrandLockup compact /><StatusPill label={demoMode ? 'Demo environment' : 'Live'} tone={demoMode ? 'amber' : 'green'} /></View>
    <Notice>{isOnline ? 'Screening records sync through the protected organization workspace.' : 'You are offline. New drafts stay on this device and show Pending secure upload until connectivity returns.'}</Notice>
    <View style={styles.heroCard}><View style={styles.heroCopy}><Text style={[styles.heroEyebrow, { color: '#a8dfe0' }]}>PRELIMINARY SCREENING</Text><Text style={styles.heroTitle}>Record evidence with confidence.</Text><Text style={styles.heroDetail}>Capture, review, and share authorized test records without losing the audit trail.</Text></View><View style={styles.heroIcon}><Feather name="shield" color="#d7f5f3" size={34} /></View></View>
    <View style={styles.statsGrid}><StatCard label="Total tests" value={tests.length} detail="In this organization" icon="clipboard" /><StatCard label="Completed today" value={completedToday} detail="Current workday" icon="check-circle" tone="green" /><StatCard label="Pending reviews" value={pending} detail={user?.role === 'laboratory_reviewer' ? 'Assigned to you' : 'Across your team'} icon="clock" tone="amber" /><StatCard label="Inconclusive" value={inconclusive} detail="Needs attention" icon="alert-circle" tone="red" /></View>
    <View><SectionTitle eyebrow="Quick actions" title="Start from here" /><View style={styles.quickGrid}><QuickAction icon="plus" label="New test" detail="Guided capture" onPress={() => router.push('/new-test')} color={colors.secondary} /><QuickAction icon="maximize" label="Scan QR" detail="Resolve subject token" onPress={() => router.push('/new-test?scan=1')} color="#e4f4ed" /><QuickAction icon="clock" label="View history" detail="Search test records" onPress={() => router.push('/(tabs)/tests')} color="#fff4da" /><QuickAction icon="upload" label="Upload image" detail="Use a saved capture" onPress={() => router.push('/new-test?upload=1')} color="#fce9e9" /></View></View>
    <SectionTitle eyebrow="Latest activity" title="Recent tests" action="View all" onAction={() => router.push('/(tabs)/tests')} />
    {tests.slice(0, 3).map((test) => <TestRow key={test.id} test={test} onPress={() => router.push(`/test/${test.id}`)} />)}
    <View style={styles.disclaimer}><Feather name="info" size={14} color={colors.mutedForeground} /><Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>Screening result only. Confirm important or legally relevant results through an accredited laboratory.</Text></View>
  </ScrollView></Screen>;
}

function QuickAction({ icon, label, detail, onPress, color }: { icon: keyof typeof Feather.glyphMap; label: string; detail: string; onPress: () => void; color: string }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, { backgroundColor: pressed ? colors.secondary : colors.card, borderColor: colors.border }]}><View style={[styles.quickIcon, { backgroundColor: color }]}><Feather name={icon} size={19} color={colors.primary} /></View><Text style={[styles.quickLabel, { color: colors.foreground }]}>{label}</Text><Text style={[styles.quickDetail, { color: colors.mutedForeground }]}>{detail}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 4, paddingBottom: 22, gap: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  greeting: { fontSize: 13, fontWeight: '500' },
  name: { fontSize: 26, fontWeight: '700', letterSpacing: -0.7, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { fontSize: 12, fontWeight: '600' },
  brandLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroCard: { backgroundColor: '#102f4c', borderRadius: 22, padding: 20, flexDirection: 'row', minHeight: 168, overflow: 'hidden' },
  heroCopy: { flex: 1, gap: 8, paddingRight: 10 },
  heroEyebrow: { fontSize: 10, letterSpacing: 1.3, fontWeight: '700' },
  heroTitle: { color: '#ffffff', fontSize: 25, lineHeight: 29, fontWeight: '700', letterSpacing: -0.5 },
  heroDetail: { color: '#c4d7e2', fontSize: 13, lineHeight: 20 },
  heroIcon: { width: 62, height: 62, borderRadius: 22, backgroundColor: '#1c5064', alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  quickAction: { width: '48%', minHeight: 120, borderRadius: 16, borderWidth: 1, padding: 13, gap: 4 },
  quickIcon: { width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  quickLabel: { fontSize: 14, fontWeight: '700' },
  quickDetail: { fontSize: 11, lineHeight: 16 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, paddingVertical: 3 },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
});