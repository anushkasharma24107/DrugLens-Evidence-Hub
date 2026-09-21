import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export function Screen({ children, scroll = false, style }: { children: React.ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 16, paddingBottom: insets.bottom + (scroll ? 96 : 92) }, style]}>{children}</View>;
}

export function LogoMark({ size = 44 }: { size?: number }) {
  const colors = useColors();
  return <View style={[styles.logoMark, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: colors.primary }]}><Feather name="shield" size={size * 0.48} color={colors.primaryForeground} /></View>;
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  const colors = useColors();
  return <View style={styles.brandRow}><LogoMark size={compact ? 34 : 46} /><View><Text style={[styles.brandName, { color: colors.foreground, fontSize: compact ? 19 : 23 }]}>Drug Lense</Text>{!compact && <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>Screening evidence, handled safely</Text>}</View></View>;
}

export function PrimaryButton({ label, onPress, icon, disabled = false, tone = 'primary', style, testID }: { label: string; onPress: () => void; icon?: keyof typeof Feather.glyphMap; disabled?: boolean; tone?: 'primary' | 'secondary' | 'danger'; style?: StyleProp<ViewStyle>; testID?: string }) {
  const colors = useColors();
  const backgroundColor = tone === 'danger' ? colors.destructive : tone === 'secondary' ? colors.secondary : colors.primary;
  const foregroundColor = tone === 'secondary' ? colors.secondaryForeground : colors.primaryForeground;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor, opacity: disabled ? 0.45 : pressed ? 0.78 : 1 }, style]}>{icon && <Feather name={icon} size={18} color={foregroundColor} /> }<Text style={[styles.buttonText, { color: foregroundColor }]}>{label}</Text></Pressable>;
}

export function GhostButton({ label, onPress, icon, style }: { label: string; onPress: () => void; icon?: keyof typeof Feather.glyphMap; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.ghostButton, { borderColor: colors.border, backgroundColor: pressed ? colors.secondary : colors.card }, style]}>{icon && <Feather name={icon} size={17} color={colors.primary} />}<Text style={[styles.ghostText, { color: colors.primary }]}>{label}</Text></Pressable>;
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const colors = useColors();
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text><TextInput {...props} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: error ? colors.destructive : colors.input, backgroundColor: colors.card }]} accessibilityLabel={label} />{error && <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>}</View>;
}

export function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.sectionTitleRow}><View>{eyebrow && <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow.toUpperCase()}</Text>}<Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text></View>{action && onAction && <Pressable onPress={onAction}><Text style={[styles.actionText, { color: colors.primary }]}>{action}</Text></Pressable>}</View>;
}

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'green' | 'amber' | 'red' | 'teal' }) {
  const colors = useColors();
  const palette = { neutral: [colors.muted, colors.mutedForeground], green: ['#e4f4ed', '#146b4c'], amber: ['#fff4da', '#9b6812'], red: ['#fce9e9', colors.destructive], teal: [colors.secondary, colors.primary] }[tone];
  return <View style={[styles.pill, { backgroundColor: palette[0] }]}><View style={[styles.dot, { backgroundColor: palette[1] }]} /><Text style={[styles.pillText, { color: palette[1] }]}>{label}</Text></View>;
}

export function StatCard({ label, value, detail, icon, tone = 'teal' }: { label: string; value: string | number; detail: string; icon: keyof typeof Feather.glyphMap; tone?: 'teal' | 'green' | 'amber' | 'red' }) {
  const colors = useColors();
  const iconColor = tone === 'green' ? '#146b4c' : tone === 'amber' ? '#9b6812' : tone === 'red' ? colors.destructive : colors.primary;
  return <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.statIcon, { backgroundColor: tone === 'green' ? '#e4f4ed' : tone === 'amber' ? '#fff4da' : tone === 'red' ? '#fce9e9' : colors.secondary }]}><Feather name={icon} size={18} color={iconColor} /></View><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.statDetail, { color: colors.mutedForeground }]}>{detail}</Text></View>;
}

export function TestRow({ test, onPress }: { test: { testReference: string; subjectCode: string; kitName: string; status: string; overallResult: string; createdAt: string; syncStatus?: string }; onPress: () => void }) {
  const colors = useColors();
  const resultLabel = test.overallResult === 'presumptive_positive' ? 'Presumptive positive' : test.overallResult === 'not_analyzed' ? 'Not analyzed' : test.overallResult[0].toUpperCase() + test.overallResult.slice(1);
  const statusTone = test.status === 'approved' ? 'green' : test.status === 'rejected' ? 'red' : test.status === 'inconclusive' ? 'amber' : 'teal';
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.testRow, { backgroundColor: pressed ? colors.secondary : colors.card, borderColor: colors.border }]}><View style={styles.testRowTop}><Text style={[styles.reference, { color: colors.foreground }]}>{test.testReference}</Text><StatusPill label={test.status.replace('_', ' ')} tone={statusTone} /></View><Text style={[styles.testSubject, { color: colors.primary }]}>{test.subjectCode} <Text style={{ color: colors.mutedForeground }}>• {test.kitName}</Text></Text><View style={styles.testRowBottom}><Text style={[styles.testMeta, { color: colors.mutedForeground }]}>{new Date(test.createdAt).toLocaleDateString()} · {resultLabel}</Text>{test.syncStatus === 'pending_upload' && <StatusPill label="Pending secure upload" tone="amber" />}</View></Pressable>;
}

export function LoadingState() {
  const colors = useColors();
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading secure records…</Text></View>;
}

export function EmptyState({ title, detail, icon = 'inbox' }: { title: string; detail: string; icon?: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  return <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={24} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyDetail, { color: colors.mutedForeground }]}>{detail}</Text></View>;
}

export function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'warning' }) {
  const colors = useColors();
  const bg = tone === 'warning' ? '#fff4da' : colors.secondary;
  const fg = tone === 'warning' ? '#7a5616' : colors.primary;
  return <View style={[styles.notice, { backgroundColor: bg, borderColor: tone === 'warning' ? '#f2d995' : '#b9e0e3' }]}><Feather name={tone === 'warning' ? 'alert-triangle' : 'info'} size={17} color={fg} /><Text style={[styles.noticeText, { color: fg }]}>{children}</Text></View>;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoMark: { alignItems: 'center', justifyContent: 'center' },
  brandName: { fontWeight: '700', letterSpacing: -0.5 },
  brandSub: { fontSize: 12, marginTop: 2 },
  button: { minHeight: 50, paddingHorizontal: 18, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  ghostButton: { minHeight: 48, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ghostText: { fontSize: 15, fontWeight: '600' },
  field: { gap: 7 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, fontSize: 16 },
  errorText: { fontSize: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 13 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  sectionTitle: { fontSize: 21, fontWeight: '700', letterSpacing: -0.3 },
  actionText: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  statCard: { width: '48%', minHeight: 135, borderRadius: 18, padding: 15, borderWidth: 1, gap: 4 },
  statIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '500' },
  statValue: { fontSize: 27, fontWeight: '700', letterSpacing: -1 },
  statDetail: { fontSize: 11 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  testRow: { borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 10, gap: 8 },
  testRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  reference: { fontSize: 15, fontWeight: '700' },
  testSubject: { fontSize: 13, fontWeight: '700' },
  testRowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  testMeta: { fontSize: 12, flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  empty: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 40, gap: 10 },
  emptyIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontWeight: '700', fontSize: 17 },
  emptyDetail: { textAlign: 'center', lineHeight: 20, fontSize: 13 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderWidth: 1, borderRadius: 13, padding: 12 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '500' },
});