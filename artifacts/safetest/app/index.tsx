import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeTest, type Role } from '@/context/SafeTestContext';
import { BrandLockup, Field, Notice, PrimaryButton, Screen, StatusPill } from '@/components/SafeTestUI';
import { useColors } from '@/hooks/useColors';

const roleLabels: Record<Role, string> = {
  admin: 'Admin',
  field_operator: 'Field operator',
  laboratory_reviewer: 'Laboratory reviewer',
  doctor: 'Doctor / viewer',
};

const onboarding = [
  { icon: 'camera' as const, title: 'Capture evidence clearly', detail: 'Guide a test-strip image with a consistent, reviewable capture process.' },
  { icon: 'check-circle' as const, title: 'Check image quality', detail: 'Review blur, glare, brightness, framing, and resolution before recording.' },
  { icon: 'file-text' as const, title: 'Keep an auditable record', detail: 'Store the screening result, evidence, consent, and review history together.' },
];

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated, signIn } = useSafeTest();
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState<'welcome' | 'signin' | 'signup' | 'forgot'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('field_operator');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (isAuthenticated) {
    router.replace('/(tabs)');
    return null;
  }

  const submit = async () => {
    if (!email.includes('@')) { setError('Enter a valid email address.'); return; }
    if (password.length < 6) { setError('Use at least 6 characters for the password.'); return; }
    setError('');
    await signIn(email, password, role);
    router.replace('/(tabs)');
  };

  if (mode === 'welcome') {
    const step = onboarding[page];
    return <Screen>
      <ScrollView contentContainerStyle={welcomeStyles.welcomeContent} showsVerticalScrollIndicator={false}>
        <View style={welcomeStyles.top}><BrandLockup /><StatusPill label="Demo environment" tone="amber" /></View>
        <View style={[welcomeStyles.heroArt, { backgroundColor: colors.secondary }]}><View style={[welcomeStyles.heroCircle, { backgroundColor: colors.primary }]}><Feather name={step.icon} size={50} color={colors.primaryForeground} /></View><View style={[welcomeStyles.heroLine, { backgroundColor: colors.border }]} /><View style={[welcomeStyles.heroLineShort, { backgroundColor: colors.border }]} /></View>
        <Text style={[welcomeStyles.kicker, { color: colors.primary }]}>FIELD EVIDENCE, SIMPLIFIED</Text>
        <Text style={[welcomeStyles.welcomeTitle, { color: colors.foreground }]}>{step.title}</Text>
        <Text style={[welcomeStyles.welcomeDetail, { color: colors.mutedForeground }]}>{step.detail}</Text>
        <View style={welcomeStyles.dots}>{onboarding.map((_, index) => <Pressable key={index} accessibilityLabel={`Onboarding page ${index + 1}`} onPress={() => setPage(index)} style={[welcomeStyles.dot, { backgroundColor: index === page ? colors.primary : colors.border }]} />)}</View>
        <PrimaryButton label={page === onboarding.length - 1 ? 'Get started' : 'Continue'} icon="arrow-right" onPress={() => page === onboarding.length - 1 ? setMode('signin') : setPage(page + 1)} />
        <Pressable onPress={() => setMode('signin')} style={welcomeStyles.signInLink}><Text style={[welcomeStyles.signInText, { color: colors.primary }]}>Already have access? Sign in</Text></Pressable>
        <Text style={[welcomeStyles.disclaimer, { color: colors.mutedForeground }]}>SafeTest records preliminary screening evidence. It does not provide a legally confirmed diagnosis.</Text>
      </ScrollView>
    </Screen>;
  }

  return <Screen><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={authStyles.content} keyboardShouldPersistTaps="handled">
      <BrandLockup compact />
      <View style={authStyles.heading}><Text style={[authStyles.title, { color: colors.foreground }]}>{mode === 'forgot' ? 'Recover access' : mode === 'signup' ? 'Create your access' : 'Welcome back'}</Text><Text style={[authStyles.detail, { color: colors.mutedForeground }]}>{mode === 'forgot' ? 'Enter your email and we’ll show the recovery next step.' : 'Use demo access to explore each SafeTest role.'}</Text></View>
      {mode === 'forgot' ? <><Field label="Work email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@organization.org" /><PrimaryButton label="Send recovery link" icon="mail" onPress={() => setMode('signin')} /></> : <><Field label="Work email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@organization.org" error={error && !email.includes('@') ? error : undefined} /><View><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} placeholder="At least 6 characters" error={error && email.includes('@') ? error : undefined} /><Pressable onPress={() => setShowPassword(!showPassword)} style={authStyles.passwordToggle}><Feather name={showPassword ? 'eye-off' : 'eye'} size={17} color={colors.mutedForeground} /><Text style={[authStyles.toggleText, { color: colors.mutedForeground }]}>{showPassword ? 'Hide' : 'Show'}</Text></Pressable></View><View style={authStyles.roleHeading}><Text style={[authStyles.roleTitle, { color: colors.foreground }]}>Explore as</Text><Text style={[authStyles.roleHint, { color: colors.mutedForeground }]}>Your permissions shape the screens you see.</Text></View><View style={authStyles.roleGrid}>{(Object.keys(roleLabels) as Role[]).map((roleOption) => <Pressable key={roleOption} onPress={() => setRole(roleOption)} style={[authStyles.roleChip, { backgroundColor: role === roleOption ? colors.secondary : colors.card, borderColor: role === roleOption ? colors.primary : colors.border }]}><View style={[authStyles.roleRadio, { borderColor: role === roleOption ? colors.primary : colors.border, backgroundColor: role === roleOption ? colors.primary : 'transparent' }]} /> <Text style={[authStyles.roleChipText, { color: colors.foreground }]}>{roleLabels[roleOption]}</Text></Pressable>)}</View><Notice>Demo mode uses fake data only. Use a connected authentication provider and backend configuration before handling real records.</Notice><PrimaryButton label={mode === 'signup' ? 'Create demo account' : 'Sign in'} icon="log-in" onPress={submit} /></>}
      {mode !== 'forgot' && <Pressable onPress={() => setMode('forgot')} style={authStyles.secondaryLink}><Text style={[authStyles.linkText, { color: colors.primary }]}>Forgot password?</Text></Pressable>}
      <View style={authStyles.switchRow}><Text style={[authStyles.switchText, { color: colors.mutedForeground }]}>{mode === 'signup' ? 'Already have an account?' : 'Need an account?'}</Text><Pressable onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}><Text style={[authStyles.linkText, { color: colors.primary }]}>{mode === 'signup' ? ' Sign in' : ' Sign up'}</Text></Pressable></View>
    </ScrollView>
  </KeyboardAvoidingView></Screen>;
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
const welcomeStyles = StyleSheet.create({
  welcomeContent: { flexGrow: 1, justifyContent: 'center', gap: 18, paddingVertical: 18 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroArt: { height: 255, borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 11, marginTop: 20 },
  heroCircle: { width: 112, height: 112, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  heroLine: { width: 100, height: 8, borderRadius: 4 },
  heroLineShort: { width: 62, height: 8, borderRadius: 4 },
  kicker: { letterSpacing: 1.3, fontSize: 11, fontWeight: '700', marginTop: 8 },
  welcomeTitle: { fontSize: 31, lineHeight: 37, fontWeight: '700', letterSpacing: -1 },
  welcomeDetail: { fontSize: 16, lineHeight: 24 },
  dots: { flexDirection: 'row', gap: 7, marginVertical: 2 },
  dot: { width: 22, height: 5, borderRadius: 99 },
  signInLink: { alignItems: 'center', padding: 8 },
  signInText: { fontWeight: '700', fontSize: 14 },
  disclaimer: { textAlign: 'center', lineHeight: 18, fontSize: 11, marginTop: 6 },
});
const authStyles = StyleSheet.create({
  content: { flexGrow: 1, gap: 17, paddingVertical: 15 },
  heading: { gap: 6, marginTop: 26, marginBottom: 6 },
  title: { fontSize: 29, fontWeight: '700', letterSpacing: -0.7 },
  detail: { fontSize: 14, lineHeight: 21 },
  passwordToggle: { position: 'absolute', right: 14, bottom: 16, flexDirection: 'row', gap: 6, alignItems: 'center' },
  toggleText: { fontSize: 12, fontWeight: '600' },
  roleHeading: { gap: 3, marginTop: 4 },
  roleTitle: { fontSize: 14, fontWeight: '700' },
  roleHint: { fontSize: 12 },
  roleGrid: { gap: 8 },
  roleChip: { borderWidth: 1, borderRadius: 13, minHeight: 46, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleRadio: { width: 16, height: 16, borderRadius: 8, borderWidth: 4 },
  roleChipText: { fontSize: 14, fontWeight: '600' },
  secondaryLink: { alignItems: 'center', padding: 3 },
  linkText: { fontWeight: '700', fontSize: 13 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: 10 },
  switchText: { fontSize: 13 },
});