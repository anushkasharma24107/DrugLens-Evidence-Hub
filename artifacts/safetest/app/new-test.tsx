import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeTest, type OverallResult, type PanelResult } from '@/context/SafeTestContext';
import { assessDemoImage, type ImageQualityAssessment } from '@/services/mockImageAnalysis';
import { Field, GhostButton, Notice, PrimaryButton, Screen, SectionTitle, StatusPill } from '@/components/SafeTestUI';
import { useColors } from '@/hooks/useColors';

const steps = ['Subject', 'Kit', 'Capture', 'Quality', 'Result'];

export default function NewTestScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ scan?: string; upload?: string }>();
  const { user, subjects, kits, createSubject, createTest, isOnline } = useSafeTest();
  const [step, setStep] = useState(0);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [kitId, setKitId] = useState(kits.find((kit) => kit.enabled)?.id ?? '');
  const [imageUri, setImageUri] = useState('');
  const [assessment, setAssessment] = useState<ImageQualityAssessment | null>(null);
  const [flash, setFlash] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(params.scan !== '1' && params.upload !== '1');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [panels, setPanels] = useState<PanelResult[]>([]);
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const selectedSubject = subjects.find((subject) => subject.id === subjectId);
  const selectedKit = kits.find((kit) => kit.id === kitId);
  const visibleSubjects = subjects.filter((subject) => !subjectSearch || subject.subjectCode.toLowerCase().includes(subjectSearch.toLowerCase()));
  const canCreate = user?.role === 'field_operator' || user?.role === 'admin';

  if (!canCreate) return <Screen><View style={styles.denied}><View style={[styles.deniedIcon, { backgroundColor: colors.secondary }]}><Feather name="lock" size={25} color={colors.primary} /></View><Text style={[styles.deniedTitle, { color: colors.foreground }]}>Creation access is limited</Text><Text style={[styles.deniedDetail, { color: colors.mutedForeground }]}>Only field operators and admins can create screening tests. Your current role can review or view authorized records.</Text><PrimaryButton label="Return to dashboard" onPress={() => router.back()} icon="arrow-left" /></View></Screen>;

  const next = () => {
    if (step === 0 && !selectedSubject) return;
    if (step === 1 && (!selectedKit || !selectedKit.enabled || new Date(selectedKit.expiresAt) < new Date())) return;
    if (step === 2 && !imageUri) return;
    if (step === 3 && !assessment?.usable) return;
    if (step === 4 && !confirmed) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };
  const back = () => step === 0 ? router.back() : setStep((current) => current - 1);
  const captureFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!result.canceled && result.assets[0]?.uri) { setImageUri(result.assets[0].uri); setCameraOpen(false); setStep(3); setAssessment(assessDemoImage(result.assets[0].uri)); }
  };
  const captureWithCamera = async () => {
    if (!cameraPermission?.granted) { await requestCameraPermission(); return; }
    setCameraOpen(true);
  };
  const saveTest = () => {
    if (!selectedSubject || !selectedKit || !assessment) return;
    const result: OverallResult = panels.some((panel) => panel.result === 'presumptive_positive') ? 'presumptive_positive' : panels.some((panel) => panel.result === 'inconclusive') ? 'inconclusive' : 'negative';
    const test = createTest({ subjectId: selectedSubject.id, subjectCode: selectedSubject.subjectCode, kitId: selectedKit.id, kitName: selectedKit.name, reviewerName: undefined, status: 'draft', overallResult: result, panelResults: panels, imageQualityScore: assessment.score, imageHash: 'sha256:demo-image-hash', notes, consentStatus: selectedSubject.consentStatus }, !isOnline);
    Alert.alert('Test saved', `${test.testReference} is ${isOnline ? 'saved as a draft' : 'queued for secure upload'}.`, [{ text: 'View record', onPress: () => router.replace(`/test/${test.id}`) }, { text: 'Done', onPress: () => router.replace('/(tabs)') }]);
  };

  return <Screen><View style={styles.container}><View style={styles.header}><Pressable onPress={back} hitSlop={12}><Feather name="arrow-left" size={22} color={colors.foreground} /></Pressable><View style={styles.headerCopy}><Text style={[styles.kicker, { color: colors.primary }]}>NEW SCREENING TEST</Text><Text style={[styles.headerTitle, { color: colors.foreground }]}>{steps[step]}</Text></View><Text style={[styles.stepCount, { color: colors.mutedForeground }]}>{step + 1}/{steps.length}</Text></View><View style={styles.progressRow}>{steps.map((label, index) => <View key={label} style={styles.progressItem}><View style={[styles.progressLine, { backgroundColor: index <= step ? colors.primary : colors.border }]} /><Text style={[styles.progressLabel, { color: index === step ? colors.primary : colors.mutedForeground }]}>{label}</Text></View>)}</View><ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
    {step === 0 && <View style={styles.stepContent}><Notice>Use an internal subject code. Keep names and unnecessary medical information out of the field workflow.</Notice><Field label="Search subjects" placeholder="Search by internal subject ID" value={subjectSearch} onChangeText={setSubjectSearch} autoCapitalize="characters" /><View style={styles.list}>{visibleSubjects.map((subject) => <Pressable key={subject.id} onPress={() => setSubjectId(subject.id)} style={[styles.option, { backgroundColor: subjectId === subject.id ? colors.secondary : colors.card, borderColor: subjectId === subject.id ? colors.primary : colors.border }]}><View style={[styles.optionIcon, { backgroundColor: subjectId === subject.id ? colors.primary : colors.muted }]}><Feather name="user" size={17} color={subjectId === subject.id ? colors.primaryForeground : colors.mutedForeground} /></View><View style={styles.optionCopy}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{subject.subjectCode}</Text><Text style={[styles.optionDetail, { color: colors.mutedForeground }]}>{subject.testCount} previous tests · Consent {subject.consentStatus}</Text></View>{subjectId === subject.id && <Feather name="check-circle" size={19} color={colors.primary} />}</Pressable>)}</View><View style={styles.createBox}><SectionTitle title="New subject" eyebrow="OPTIONAL" /><Field label="Internal subject ID" placeholder="e.g. ST-6204" value={newSubjectCode} onChangeText={setNewSubjectCode} autoCapitalize="characters" /><GhostButton label="Create and select subject" icon="user-plus" onPress={() => { if (!newSubjectCode.trim()) return; createSubject(newSubjectCode.trim(), 'pending'); setNewSubjectCode(''); Alert.alert('Subject created', 'Consent is pending. Update consent before saving a test.'); }} /></View></View>}
    {step === 1 && <View style={styles.stepContent}><Notice>Expired or disabled kits are unavailable for selection. Version and panel coverage are recorded with the evidence.</Notice><View style={styles.list}>{kits.map((kit) => { const disabled = !kit.enabled || new Date(kit.expiresAt) < new Date(); return <Pressable disabled={disabled} key={kit.id} onPress={() => setKitId(kit.id)} style={[styles.kitCard, { opacity: disabled ? 0.45 : 1, backgroundColor: kitId === kit.id ? colors.secondary : colors.card, borderColor: kitId === kit.id ? colors.primary : colors.border }]}><View style={styles.kitRow}><View style={[styles.optionIcon, { backgroundColor: kitId === kit.id ? colors.primary : colors.muted }]}><Feather name="package" size={17} color={kitId === kit.id ? colors.primaryForeground : colors.mutedForeground} /></View><View style={styles.optionCopy}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{kit.name}</Text><Text style={[styles.optionDetail, { color: colors.mutedForeground }]}>{kit.manufacturer} · {kit.version}</Text></View><StatusPill label={disabled ? 'Unavailable' : 'Available'} tone={disabled ? 'red' : kitId === kit.id ? 'teal' : 'green'} /></View><Text style={[styles.panelText, { color: colors.mutedForeground }]}>Panels: {kit.panels.join(' · ')}</Text><Text style={[styles.panelText, { color: colors.mutedForeground }]}>Expires {kit.expiresAt}</Text></Pressable>; })}</View></View>}
    {step === 2 && <View style={styles.stepContent}><Notice>Place the complete strip inside the guide. Avoid glare, shadows, and cropped control lines.</Notice>{cameraOpen ? <View style={styles.cameraWrap}>{cameraPermission?.granted ? <CameraView style={styles.camera} facing="back" flash={flash ? 'on' : 'off'} onCameraReady={() => undefined}><View style={styles.cameraGuide}><View style={styles.guideCorner} /><Text style={styles.guideText}>Align strip inside guide</Text></View><View style={styles.cameraControls}><Pressable onPress={() => setFlash(!flash)} style={styles.cameraButton}><Feather name={flash ? 'sun' : 'moon'} size={20} color="#ffffff" /></Pressable><Pressable onPress={async () => { const ref = (globalThis as unknown as { __cameraRef?: { takePictureAsync: () => Promise<{ uri?: string }> } }).__cameraRef; if (ref) { const photo = await ref.takePictureAsync(); if (photo.uri) { setImageUri(photo.uri); setCameraOpen(false); setAssessment(assessDemoImage(photo.uri)); setStep(3); } } else { setImageUri('demo://captured-strip'); setCameraOpen(false); setAssessment(assessDemoImage('demo://captured-strip')); setStep(3); } }} style={styles.captureButton}><View style={styles.captureInner} /></Pressable><Pressable onPress={() => setCameraOpen(false)} style={styles.cameraButton}><Feather name="x" size={22} color="#ffffff" /></Pressable></View></CameraView> : <View style={styles.cameraPermission}><Feather name="camera-off" size={26} color={colors.primary} /><Text style={[styles.permissionTitle, { color: colors.foreground }]}>Camera permission needed</Text><Text style={[styles.permissionDetail, { color: colors.mutedForeground }]}>Allow access to capture a test-strip image on this device.</Text><PrimaryButton label="Allow camera" icon="camera" onPress={captureWithCamera} /></View>}</View> : <View style={styles.captureOptions}><Pressable onPress={captureWithCamera} style={[styles.captureOption, { backgroundColor: colors.primary }]}><Feather name="camera" size={24} color={colors.primaryForeground} /><Text style={styles.captureOptionText}>Open camera</Text><Text style={styles.captureOptionDetail}>Capture a new image</Text></Pressable><Pressable onPress={captureFromGallery} style={[styles.captureOption, { backgroundColor: colors.secondary }]}><Feather name="image" size={24} color={colors.primary} /><Text style={[styles.captureOptionText, { color: colors.foreground }]}>Choose image</Text><Text style={[styles.captureOptionDetail, { color: colors.mutedForeground }]}>Use a saved capture</Text></Pressable></View>}{imageUri && <View style={styles.previewBox}>{imageUri.startsWith('demo://') ? <View style={[styles.demoImage, { backgroundColor: colors.secondary }]}><Feather name="image" size={28} color={colors.primary} /><Text style={[styles.demoImageText, { color: colors.primary }]}>Captured demo image</Text></View> : <Image source={{ uri: imageUri }} style={styles.previewImage} />}<GhostButton label="Retake" icon="refresh-cw" onPress={() => { setImageUri(''); setCameraOpen(false); setStep(2); }} /></View>}</View>}
    {step === 3 && assessment && <View style={styles.stepContent}><View style={[styles.scoreCard, { backgroundColor: assessment.usable ? '#e4f4ed' : '#fce9e9' }]}><View style={styles.scoreText}><Text style={[styles.scoreLabel, { color: assessment.usable ? '#146b4c' : colors.destructive }]}>IMAGE QUALITY</Text><Text style={[styles.scoreValue, { color: assessment.usable ? '#146b4c' : colors.destructive }]}>{assessment.score}/100</Text><Text style={[styles.scoreDetail, { color: colors.mutedForeground }]}>{assessment.explanation}</Text></View><View style={[styles.scoreRing, { borderColor: assessment.usable ? '#2c9b6a' : colors.destructive }]}><Feather name={assessment.usable ? 'check' : 'x'} size={27} color={assessment.usable ? '#2c9b6a' : colors.destructive} /></View></View><View style={styles.qualityList}>{[['Blur', assessment.blur], ['Brightness', assessment.brightness], ['Glare', assessment.glare], ['Strip position', assessment.stripPosition], ['Resolution', assessment.resolution]].map(([label, value]) => <View key={label} style={[styles.qualityRow, { borderBottomColor: colors.border }]}><Text style={[styles.qualityLabel, { color: colors.foreground }]}>{label}</Text><StatusPill label={value === 'pass' ? 'Pass' : 'Review'} tone={value === 'pass' ? 'green' : 'amber'} /></View>)}</View><Notice tone="warning">This is deterministic demo analysis, not medical-grade AI. Confirm the image is usable before continuing.</Notice></View>}
    {step === 4 && selectedKit && <View style={styles.stepContent}><Notice>Results are preliminary screening observations. Never convert them into a confirmed diagnosis.</Notice><SectionTitle title="Panel observations" eyebrow={selectedKit.name} />{selectedKit.panels.slice(0, 5).map((drug) => { const current = panels.find((panel) => panel.drug === drug)?.result ?? 'negative'; return <View key={drug} style={[styles.panelCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.panelHeader}><Text style={[styles.panelName, { color: colors.foreground }]}>{drug}</Text><StatusPill label={`${Math.round((panels.find((panel) => panel.drug === drug)?.confidence ?? 0.94) * 100)}% confidence`} tone="teal" /></View><View style={styles.resultRow}>{(['negative', 'presumptive_positive', 'inconclusive'] as const).map((result) => <Pressable key={result} onPress={() => setPanels((currentPanels) => [...currentPanels.filter((panel) => panel.drug !== drug), { drug, result, confidence: result === 'negative' ? 0.94 : result === 'presumptive_positive' ? 0.76 : 0.42 }])} style={[styles.resultChoice, { backgroundColor: current === result ? result === 'negative' ? '#e4f4ed' : result === 'presumptive_positive' ? '#fff4da' : '#fce9e9' : colors.muted, borderColor: current === result ? result === 'negative' ? '#8dc8a8' : result === 'presumptive_positive' ? '#e4c978' : '#e4a5a5' : colors.border }]}><Text style={[styles.resultChoiceText, { color: current === result ? result === 'negative' ? '#146b4c' : result === 'presumptive_positive' ? '#805b16' : colors.destructive : colors.mutedForeground }]}>{result === 'presumptive_positive' ? 'Presumptive +' : result[0].toUpperCase() + result.slice(1)}</Text></Pressable>)}</View></View>})}<Field label="Operator notes (optional)" placeholder="Add context for the reviewer" value={notes} onChangeText={setNotes} multiline numberOfLines={3} /><Pressable onPress={() => setConfirmed(!confirmed)} style={styles.confirmRow}><View style={[styles.checkbox, { borderColor: confirmed ? colors.primary : colors.border, backgroundColor: confirmed ? colors.primary : colors.card }]}>{confirmed && <Feather name="check" size={14} color={colors.primaryForeground} />}</View><Text style={[styles.confirmText, { color: colors.foreground }]}>I understand this is a preliminary screening result.</Text></Pressable></View>}
  </ScrollView><View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>{step > 0 && <GhostButton label="Back" icon="arrow-left" onPress={back} style={styles.footerButton} />}{step < steps.length - 1 ? <PrimaryButton label="Continue" icon="arrow-right" onPress={next} style={styles.footerButton} /> : <PrimaryButton label={isOnline ? 'Save test' : 'Save draft offline'} icon="check" onPress={saveTest} style={styles.footerButton} />}</View></View></Screen>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCopy: { flex: 1 },
  kicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  headerTitle: { fontSize: 21, fontWeight: '700', marginTop: 2 },
  stepCount: { fontSize: 12, fontWeight: '700' },
  progressRow: { flexDirection: 'row', gap: 5, marginTop: 18 },
  progressItem: { flex: 1, gap: 6 },
  progressLine: { height: 4, borderRadius: 3 },
  progressLabel: { fontSize: 9, fontWeight: '600' },
  scrollContent: { paddingTop: 18, paddingBottom: 100, gap: 17 },
  stepContent: { gap: 15 },
  list: { gap: 9 },
  option: { minHeight: 66, borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionCopy: { flex: 1, gap: 3 },
  optionTitle: { fontSize: 14, fontWeight: '700' },
  optionDetail: { fontSize: 11 },
  createBox: { gap: 10, marginTop: 6 },
  kitCard: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 8 },
  kitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panelText: { fontSize: 11, paddingLeft: 45 },
  captureOptions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  captureOption: { flex: 1, minHeight: 155, borderRadius: 18, padding: 16, justifyContent: 'flex-end', gap: 7 },
  captureOptionText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  captureOptionDetail: { color: '#dcebed', fontSize: 12 },
  cameraWrap: { height: 430, borderRadius: 20, overflow: 'hidden', backgroundColor: '#10243e' },
  camera: { flex: 1, justifyContent: 'space-between' },
  cameraGuide: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  guideCorner: { width: '72%', height: 185, borderWidth: 2, borderColor: '#d7f5f3', borderRadius: 14 },
  guideText: { color: '#ffffff', fontSize: 13, fontWeight: '600', backgroundColor: '#10243ecc', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  cameraControls: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cameraButton: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10243e99' },
  captureButton: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ffffff' },
  cameraPermission: { minHeight: 290, borderRadius: 20, backgroundColor: '#e8f3f4', alignItems: 'center', justifyContent: 'center', padding: 25, gap: 10 },
  permissionTitle: { fontSize: 17, fontWeight: '700' },
  permissionDetail: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 7 },
  previewBox: { gap: 10 },
  previewImage: { width: '100%', height: 190, borderRadius: 18, resizeMode: 'cover' },
  demoImage: { height: 190, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 7 },
  demoImageText: { fontWeight: '700', fontSize: 13 },
  scoreCard: { borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13 },
  scoreText: { flex: 1, gap: 4 },
  scoreLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  scoreValue: { fontSize: 31, fontWeight: '700', letterSpacing: -1 },
  scoreDetail: { fontSize: 11, lineHeight: 17 },
  scoreRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  qualityList: { borderTopWidth: 1, borderTopColor: '#d8e2e6' },
  qualityRow: { minHeight: 48, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qualityLabel: { fontSize: 13, fontWeight: '600' },
  panelCard: { borderWidth: 1, borderRadius: 16, padding: 13, gap: 11 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelName: { fontSize: 15, fontWeight: '700' },
  resultRow: { flexDirection: 'row', gap: 6 },
  resultChoice: { flex: 1, borderWidth: 1, borderRadius: 10, minHeight: 37, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  resultChoiceText: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  confirmRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  confirmText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', gap: 10, borderTopWidth: 1 },
  footerButton: { flex: 1 },
  denied: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  deniedIcon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  deniedTitle: { fontSize: 21, fontWeight: '700' },
  deniedDetail: { textAlign: 'center', lineHeight: 21, fontSize: 14, marginBottom: 10 },
});