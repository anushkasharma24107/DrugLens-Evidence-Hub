import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeTest } from '@/context/SafeTestContext';
import { EmptyState, Field, Screen, SectionTitle, StatusPill, TestRow } from '@/components/SafeTestUI';
import { useColors } from '@/hooks/useColors';

export default function TestsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { tests, user } = useSafeTest();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'review' | 'approved' | 'inconclusive'>('all');
  const visibleTests = useMemo(() => tests.filter((test) => {
    const matchesSearch = !search || `${test.testReference} ${test.subjectCode} ${test.kitName}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'review' && ['submitted', 'under_review'].includes(test.status)) || test.status === filter;
    const matchesRole = user?.role !== 'field_operator' || test.operatorName === user.name;
    return matchesSearch && matchesFilter && matchesRole;
  }), [filter, search, tests, user]);
  return <Screen scroll><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><View style={styles.titleRow}><View><Text style={[styles.eyebrow, { color: colors.primary }]}>SECURE HISTORY</Text><Text style={[styles.title, { color: colors.foreground }]}>Test records</Text></View><Pressable onPress={() => router.push('/new-test')} style={[styles.addButton, { backgroundColor: colors.primary }]}><Feather name="plus" size={20} color={colors.primaryForeground} /></Pressable></View><Field label="Search records" placeholder="Reference, subject ID, or kit" value={search} onChangeText={setSearch} autoCapitalize="none" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{[['all', 'All'], ['review', 'Needs review'], ['approved', 'Approved'], ['inconclusive', 'Inconclusive']].map(([value, label]) => <Pressable key={value} onPress={() => setFilter(value as typeof filter)}><StatusPill label={label} tone={filter === value ? 'teal' : 'neutral'} /></Pressable>)}</ScrollView><SectionTitle title={`${visibleTests.length} record${visibleTests.length === 1 ? '' : 's'}`} eyebrow="Organization scope" />{visibleTests.length ? visibleTests.map((test) => <TestRow key={test.id} test={test} onPress={() => router.push(`/test/${test.id}`)} />) : <EmptyState title="No matching tests" detail="Try a different search or clear the filter. Records remain limited to your organization permissions." />}</ScrollView></Screen>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 4, paddingBottom: 25, gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  eyebrow: { fontSize: 11, letterSpacing: 1.2, fontWeight: '700', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.7 },
  addButton: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: 8, paddingVertical: 2 },
});