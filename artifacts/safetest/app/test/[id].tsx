import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeTest } from '@/context/SafeTestContext';
import { GhostButton, Notice, PrimaryButton, Screen, SectionTitle, StatusPill } from '@/components/SafeTestUI';
import { useColors } from '@/hooks/useColors';

export default function TestDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tests, user, reviewTest, updateTest } = useSafeTest();
  const test = tests.find((record) => record.id === id);
  if (!test) return <Screen><View style={styles.empty}><Feather name="file-minus" size={28} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Record unavailable</Text><Text style={[styles.emptyDetail, { color: colors.mutedForeground }]}>This record may have been deleted or is outside your organization scope.</Text><PrimaryButton label="Go back" icon="arrow-left" onPress={() => router.back()} /></View></Screen>;
  const canReview = user?.role === 'laboratory_reviewer' || user?.role === 'admin';
  const canSubmit = (user?.role === 'field_operator' || user?.role === 'admin') && ['draft', 'pending_upload'].includes(test.status);
  const resultTone = test.overallResult === 'negative' ? 'green' : test.overallResult === 'presumptive_positive' ? 'amber' : 'red';
  return <Screen scroll><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><View style={styles.heading}><View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: colors.primary }]}>TEST REFERENCE</Text><Text style={[styles.reference, { color: colors.foreground }]}>{test.testReference}</Text><Text style={[styles.created, { color: colors.mutedForeground }]}>{new Date(test.createdAt).toLocaleString()}</Text></View><StatusPill label={test.status.replace('_', ' ')} tone={test.status === 'approved' ? 'green' : test.status === 'rejected' ? 'red' : test.status === 'inconclusive' ? 'amber' : 'teal'} /></View><Notice tone="warning">Screening result only. Confirm important or legally relevant results through an accredited laboratory.</Notice><View style={[styles.resultCard, { backgroundColor: test.overallResult === 'negative' ? '#e4f4ed' : test.overallResult === 'presumptive_positive' ? '#fff4da' : '#fce9e9' }]}><View style={styles.resultCopy}><Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>OVERALL SCREENING RESULT</Text><Text style={[styles.resultValue, { color: resultTone === 'green' ? '#146b4c' : resultTone === 'amber' ? '#805b16' : colors.destructive }]}>{test.overallResult === 'presumptive_positive' ? 'Presumptive positive' : test.overallResult[0].toUpperCase() + test.overallResult.slice(1)}</Text><Text style={[styles.resultDetail, { color: colors.mutedForeground }]}>This is a preliminary observation, not a confirmed diagnosis.</Text></View><Feather name={test.overallResult === 'negative' ? 'check-circle' : 'alert-circle'} size={35} color={resultTone === 'green' ? '#146b4c' : resultTone === 'amber' ? '#9b6812' : colors.destructive} /></View><SectionTitle eyebrow="EVIDENCE" title="Record details" /><View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}><DetailRow label="Subject" value={test.subjectCode} /><DetailRow label="Kit" value={test.kitName} /><DetailRow label="Operator" value={test.operatorName} /><DetailRow label="Reviewer" value={test.reviewerName ?? 'Not assigned'} /><DetailRow label="Consent" value={test.consentStatus} /><DetailRow label="Image quality" value={`${test.imageQualityScore}/100`} /><DetailRow label="Image hash" value={test.imageHash ?? 'Not returned'} /><DetailRow label="Sync status" value={test.syncStatus === 'pending_upload' ? 'Pending secure upload' : 'Synced'} /></View><SectionTitle eyebrow="PANEL RESULTS" title={`${test.panelResults.length} observations`} />{test.panelResults.map((panel) => <View key={panel.drug} style={[styles.panelRow, { backgroundColor: colors.card, borderColor: colors.border }]}><View><Text style={[styles.panelName, { color: colors.foreground }]}>{panel.drug}</Text><Text style={[styles.panelConfidence, { color: colors.mutedForeground }]}>{Math.round(panel.confidence * 100)}% confidence{panel.note ? ` · ${panel.note}` : ''}</Text></View><StatusPill label={panel.result === 'presumptive_positive' ? 'Presumptive +' : panel.result} tone={panel.result === 'negative' ? 'green' : panel.result === 'presumptive_positive' ? 'amber' : 'red'} /></View>)}{test.notes && <><SectionTitle eyebrow="NOTES" title="Operator context" /><Text style={[styles.notes, { color: colors.foreground }]}>{test.notes}</Text></>}<SectionTitle eyebrow="AUDIT TRAIL" title="Evidence events" /><TimelineRow icon="plus-circle" label="Test record created" detail={new Date(test.createdAt).toLocaleString()} /><TimelineRow icon="shield" label={test.status === 'draft' ? 'Draft awaiting submission' : `Status: ${test.status.replace('_', ' ')}`} detail={new Date(test.updatedAt).toLocaleString()} />{test.reviewedAt && <TimelineRow icon="check-circle" label={`Reviewed by ${test.reviewerName ?? 'authorized reviewer'}`} detail={new Date(test.reviewedAt).toLocaleString()} />}{canSubmit && <PrimaryButton label={test.syncStatus === 'pending_upload' ? 'Upload when online' : 'Submit for review'} icon="send" onPress={() => { updateTest(test.id, { status: 'submitted' }); Alert.alert('Submitted', 'The test is now queued for laboratory review.'); }} />}{canReview && ['submitted', 'under_review'].includes(test.status) && <View style={styles.reviewActions}><PrimaryButton label="Approve" icon="check" onPress={() => { reviewTest(test.id, 'approve'); Alert.alert('Test approved', 'The audit trail has been updated.'); }} style={styles.actionHalf} /><PrimaryButton label="Reject" icon="x" tone="danger" onPress={() => { reviewTest(test.id, 'reject', 'Rejected during reviewer assessment.'); Alert.alert('Test rejected', 'The operator can review the audit note.'); }} style={styles.actionHalf} /><GhostButton label="Mark inconclusive" icon="alert-circle" onPress={() => { reviewTest(test.id, 'inconclusive', 'Image or panel interpretation requires accredited laboratory confirmation.'); Alert.alert('Marked inconclusive', 'The result remains a preliminary screening record.'); }} style={styles.actionFull} /></View>}<GhostButton label="Export authorized report" icon="download" onPress={() => Alert.alert('Authorized export', 'A signed report would be generated only for an authorized role with an access audit event.')} /></ScrollView></Screen>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return <View style={[styles.detailRow, { borderBottomColor: colors.border }]}><Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text></View>;
}

function TimelineRow({ icon, label, detail }: { icon: keyof typeof Feather.glyphMap; label: string; detail: string }) {
  const colors = useColors();
  return <View style={styles.timelineRow}><View style={[styles.timelineIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={16} color={colors.primary} /></View><View style={styles.timelineCopy}><Text style={[styles.timelineLabel, { color: colors.foreground }]}>{label}</Text><Text style={[styles.timelineDetail, { color: colors.mutedForeground }]}>{detail}</Text></View></View>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 4, paddingBottom: 25, gap: 14 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  reference: { fontSize: 25, fontWeight: '700', letterSpacing: -0.6, marginTop: 3 },
  created: { fontSize: 12, marginTop: 3 },
  resultCard: { borderRadius: 19, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultCopy: { flex: 1, gap: 4 },
  resultLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  resultValue: { fontSize: 25, fontWeight: '700', letterSpacing: -0.6 },
  resultDetail: { fontSize: 12, lineHeight: 18 },
  detailCard: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
  detailRow: { minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, gap: 12 },
  detailLabel: { fontSize: 12 },
  detailValue: { flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '600' },
  panelRow: { minHeight: 64, borderRadius: 15, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  panelName: { fontSize: 14, fontWeight: '700' },
  panelConfidence: { fontSize: 11, marginTop: 4, maxWidth: 220 },
  notes: { fontSize: 14, lineHeight: 21, paddingHorizontal: 2 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  timelineIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  timelineCopy: { gap: 2 },
  timelineLabel: { fontSize: 13, fontWeight: '600' },
  timelineDetail: { fontSize: 11 },
  reviewActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  actionHalf: { flex: 1, minWidth: '46%' },
  actionFull: { width: '100%' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 11, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyDetail: { textAlign: 'center', lineHeight: 20, fontSize: 14, marginBottom: 8 },
});