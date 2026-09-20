import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeTest } from '@/context/SafeTestContext';
import { BrandLockup, GhostButton, Notice, Screen, SectionTitle, StatusPill } from '@/components/SafeTestUI';
import { useColors } from '@/hooks/useColors';

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, signOut, clearLocalData, isOnline, setOnline } = useSafeTest();
  const logout = () => { void signOut(); router.replace('/'); };
  return <Screen scroll><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><View style={styles.top}><BrandLockup compact /><StatusPill label={user?.role === 'field_operator' ? 'Field operator' : user?.role === 'laboratory_reviewer' ? 'Laboratory reviewer' : user?.role === 'doctor' ? 'Authorized viewer' : 'Admin'} tone="teal" /></View><View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.avatar, { backgroundColor: colors.secondary }]}><Text style={[styles.avatarText, { color: colors.primary }]}>{user?.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text></View><View style={styles.profileCopy}><Text style={[styles.profileName, { color: colors.foreground }]}>{user?.name}</Text><Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user?.email}</Text><Text style={[styles.org, { color: colors.primary }]}>{user?.organizationName}</Text></View></View><Notice>Records are scoped to {user?.organizationName}. Access to another organization is blocked by default.</Notice><SectionTitle title="Preferences" eyebrow="YOUR WORKSPACE" /><SettingRow icon="wifi" title="Connection status" detail={isOnline ? 'Online and syncing' : 'Offline · drafts stay local'} onPress={() => setOnline(!isOnline)} right={<StatusPill label={isOnline ? 'Online' : 'Offline'} tone={isOnline ? 'green' : 'amber'} />} /><SettingRow icon="bell" title="Notifications" detail="Test review and sync updates" onPress={() => Alert.alert('Notifications', 'In-app notifications are enabled for this demo.') } /><SettingRow icon="lock" title="Privacy and security" detail="Secure session storage and local controls" onPress={() => Alert.alert('Privacy and security', 'Session tokens are stored in secure device storage. Sensitive patient data is not cached in this demo.') } /><SettingRow icon="help-circle" title="Help and support" detail="Guidance for field teams" onPress={() => Alert.alert('Help and support', 'Contact your SafeTest organization administrator for access or support.') } /><SectionTitle title="Local data" eyebrow="DEVICE CONTROLS" /><GhostButton label="Delete local data" icon="trash-2" onPress={() => Alert.alert('Delete local data?', 'This clears the local demo session and restores sample records.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { void clearLocalData(); router.replace('/'); } }])} style={{ borderColor: '#efcaca' }} /><GhostButton label="Sign out" icon="log-out" onPress={logout} /><Text style={[styles.legal, { color: colors.mutedForeground }]}>Terms and privacy policy · SafeTest is a screening and evidence-management tool, not a diagnostic service.</Text></ScrollView></Screen>;
}

function SettingRow({ icon, title, detail, onPress, right }: { icon: keyof typeof Feather.glyphMap; title: string; detail: string; onPress: () => void; right?: React.ReactNode }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.settingRow, { backgroundColor: pressed ? colors.secondary : colors.card, borderColor: colors.border }]}><View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={18} color={colors.primary} /></View><View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.settingDetail, { color: colors.mutedForeground }]}>{detail}</Text></View>{right ?? <Feather name="chevron-right" size={17} color={colors.mutedForeground} />}</Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 4, paddingBottom: 24, gap: 13 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  profileCard: { flexDirection: 'row', gap: 13, alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 16 },
  avatar: { width: 53, height: 53, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  profileCopy: { gap: 3, flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700' },
  profileEmail: { fontSize: 12 },
  org: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  settingRow: { minHeight: 70, borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  settingIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingCopy: { flex: 1, gap: 3 },
  settingTitle: { fontSize: 14, fontWeight: '700' },
  settingDetail: { fontSize: 12 },
  legal: { textAlign: 'center', fontSize: 11, lineHeight: 17, padding: 8 },
});