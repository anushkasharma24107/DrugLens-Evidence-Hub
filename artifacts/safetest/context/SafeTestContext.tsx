import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

export type Role = 'admin' | 'field_operator' | 'laboratory_reviewer' | 'doctor';
export type TestStatus = 'draft' | 'pending_upload' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'inconclusive' | 'archived';
export type OverallResult = 'negative' | 'presumptive_positive' | 'inconclusive' | 'not_analyzed';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  organizationName: string;
};

export type Subject = {
  id: string;
  subjectCode: string;
  consentStatus: 'pending' | 'granted' | 'revoked';
  qrStatus: 'active' | 'revoked';
  testCount: number;
  lastTestAt?: string;
};

export type TestKit = {
  id: string;
  name: string;
  manufacturer: string;
  version: string;
  expiresAt: string;
  enabled: boolean;
  panels: string[];
};

export type PanelResult = {
  drug: string;
  result: 'negative' | 'presumptive_positive' | 'inconclusive';
  confidence: number;
  note?: string;
};

export type ImageLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export type DrugTest = {
  id: string;
  testReference: string;
  subjectId: string;
  subjectCode: string;
  kitId: string;
  kitName: string;
  operatorName: string;
  reviewerName?: string;
  status: TestStatus;
  overallResult: OverallResult;
  panelResults: PanelResult[];
  imageQualityScore: number;
  imageHash?: string;
  evidenceFileUrl?: string;
  notes?: string;
  location?: string;
  imageTakenAt?: string;
  imageLocation?: ImageLocation;
  imagePlace?: string;
  consentStatus: string;
  syncStatus: 'synced' | 'pending_upload' | 'failed';
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
}

type AuditLog = {
  id: string;
  action: string;
  actorName: string;
  resourceType: string;
  resourceId: string;
  occurredAt: string;
};

type SafeTestContextValue = {
  hydrated: boolean;
  isAuthenticated: boolean;
  user: User | null;
  subjects: Subject[];
  kits: TestKit[];
  tests: DrugTest[];
  auditLogs: AuditLog[];
  isOnline: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string, role: Role) => Promise<void>;
  signOut: () => Promise<void>;
  createSubject: (subjectCode: string, consentStatus: Subject['consentStatus']) => Subject;
  createTest: (input: Omit<DrugTest, 'id' | 'testReference' | 'operatorName' | 'createdAt' | 'updatedAt' | 'syncStatus'>, offline?: boolean) => DrugTest;
  updateTest: (id: string, patch: Partial<DrugTest>) => void;
  reviewTest: (id: string, action: 'approve' | 'reject' | 'inconclusive', note?: string) => void;
  setOnline: (value: boolean) => void;
  clearLocalData: () => Promise<void>;
};

const STORAGE_KEY = 'safetest.local.state.v1';
const TOKEN_KEY = 'safetest.access-token';

const demoUsers: Record<Role, User> = {
  admin: { id: 'user-admin', name: 'Avery Morgan', email: 'admin@demo.druglense', role: 'admin', organizationId: 'org-northstar', organizationName: 'Northstar Community Health' },
  field_operator: { id: 'user-operator', name: 'Jordan Lee', email: 'operator@demo.druglense', role: 'field_operator', organizationId: 'org-northstar', organizationName: 'Northstar Community Health' },
  laboratory_reviewer: { id: 'user-reviewer', name: 'Dr. Casey Patel', email: 'reviewer@demo.druglense', role: 'laboratory_reviewer', organizationId: 'org-northstar', organizationName: 'Northstar Community Health' },
  doctor: { id: 'user-doctor', name: 'Dr. Sam Rivera', email: 'doctor@demo.druglense', role: 'doctor', organizationId: 'org-northstar', organizationName: 'Northstar Community Health' },
};

const seedSubjects: Subject[] = [
  { id: 'subject-2048', subjectCode: 'ST-2048', consentStatus: 'granted', qrStatus: 'active', testCount: 4, lastTestAt: '2026-09-19T08:30:00.000Z' },
  { id: 'subject-3914', subjectCode: 'ST-3914', consentStatus: 'granted', qrStatus: 'active', testCount: 2, lastTestAt: '2026-09-17T15:10:00.000Z' },
  { id: 'subject-4882', subjectCode: 'ST-4882', consentStatus: 'pending', qrStatus: 'revoked', testCount: 0 },
];

const seedKits: TestKit[] = [
  { id: 'kit-5panel', name: 'RapidCheck 5-Panel', manufacturer: 'ClearPath Diagnostics', version: 'v2.4', expiresAt: '2027-04-30', enabled: true, panels: ['THC', 'COC', 'OPI', 'AMP', 'BZO'] },
  { id: 'kit-10panel', name: 'RapidCheck 10-Panel', manufacturer: 'ClearPath Diagnostics', version: 'v1.9', expiresAt: '2026-12-15', enabled: true, panels: ['THC', 'COC', 'OPI', 'AMP', 'BZO', 'MET', 'MTD', 'BAR', 'TCA', 'OXY'] },
  { id: 'kit-expired', name: 'Legacy 5-Panel', manufacturer: 'ClearPath Diagnostics', version: 'v1.0', expiresAt: '2025-02-01', enabled: false, panels: ['THC', 'COC', 'OPI', 'AMP', 'BZO'] },
];

const seedTests: DrugTest[] = [
  {
    id: 'test-10084', testReference: 'ST-2026-10084', subjectId: 'subject-2048', subjectCode: 'ST-2048', kitId: 'kit-5panel', kitName: 'RapidCheck 5-Panel',
    operatorName: 'Jordan Lee', reviewerName: 'Dr. Casey Patel', status: 'approved', overallResult: 'negative',
    panelResults: ['THC', 'COC', 'OPI', 'AMP', 'BZO'].map((drug) => ({ drug, result: 'negative', confidence: 0.98 })),
    imageQualityScore: 94, imageHash: 'sha256:7f9b…c831', consentStatus: 'granted', syncStatus: 'synced', createdAt: '2026-09-19T08:30:00.000Z', updatedAt: '2026-09-19T09:14:00.000Z', reviewedAt: '2026-09-19T09:14:00.000Z',
  },
  {
    id: 'test-10083', testReference: 'ST-2026-10083', subjectId: 'subject-3914', subjectCode: 'ST-3914', kitId: 'kit-10panel', kitName: 'RapidCheck 10-Panel',
    operatorName: 'Jordan Lee', status: 'under_review', overallResult: 'presumptive_positive',
    panelResults: [{ drug: 'THC', result: 'presumptive_positive', confidence: 0.76 }, { drug: 'COC', result: 'negative', confidence: 0.95 }, { drug: 'OPI', result: 'negative', confidence: 0.94 }],
    imageQualityScore: 88, imageHash: 'sha256:8a16…d102', consentStatus: 'granted', syncStatus: 'synced', createdAt: '2026-09-18T15:10:00.000Z', updatedAt: '2026-09-18T15:18:00.000Z',
  },
  {
    id: 'test-10081', testReference: 'ST-2026-10081', subjectId: 'subject-2048', subjectCode: 'ST-2048', kitId: 'kit-5panel', kitName: 'RapidCheck 5-Panel',
    operatorName: 'Jordan Lee', status: 'inconclusive', overallResult: 'inconclusive',
    panelResults: [{ drug: 'THC', result: 'inconclusive', confidence: 0.41, note: 'Control line glare detected.' }],
    imageQualityScore: 52, consentStatus: 'granted', syncStatus: 'synced', createdAt: '2026-09-16T10:20:00.000Z', updatedAt: '2026-09-16T10:32:00.000Z', reviewedAt: '2026-09-16T10:32:00.000Z',
  },
];

const initialState = {
  user: null as User | null,
  subjects: seedSubjects,
  tests: seedTests,
  auditLogs: [] as AuditLog[],
  isOnline: true,
};

const SafeTestContext = createContext<SafeTestContextValue | null>(null);

async function getSessionToken() {
  return Platform.OS === 'web' ? AsyncStorage.getItem(TOKEN_KEY) : SecureStore.getItemAsync(TOKEN_KEY);
}

async function setSessionToken(value: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(TOKEN_KEY, value);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, value);
  }
}

async function deleteSessionToken() {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export function SafeTestProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>(seedSubjects);
  const [kits] = useState<TestKit[]>(seedKits);
  const [tests, setTests] = useState<DrugTest[]>(seedTests);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isOnline, setOnline] = useState(true);

  useEffect(() => {
    void (async () => {
      const [storedState, storedToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        getSessionToken(),
      ]);
      if (storedState) {
        try {
          const parsed = JSON.parse(storedState) as Partial<typeof initialState>;
          setSubjects(parsed.subjects ?? seedSubjects);
          setTests(parsed.tests ?? seedTests);
          setAuditLogs(parsed.auditLogs ?? []);
          setUser(parsed.user ?? null);
          if (!storedToken) setUser(null);
        } catch {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user, subjects, tests, auditLogs }));
  }, [hydrated, user, subjects, tests, auditLogs]);

  const addAudit = useCallback((action: string, resourceType: string, resourceId: string) => {
    setAuditLogs((current) => [{ id: `${Date.now()}-${Math.random()}`, action, actorName: user?.name ?? 'Demo user', resourceType, resourceId, occurredAt: new Date().toISOString() }, ...current].slice(0, 100));
  }, [user?.name]);

  const signIn = useCallback(async (_email: string, _password: string, role: Role) => {
    const nextUser = demoUsers[role];
    setUser(nextUser);
    await setSessionToken(`demo-session-${role}`);
    addAudit('login', 'session', nextUser.id);
  }, [addAudit]);

  const signOut = useCallback(async () => {
    if (user) addAudit('logout', 'session', user.id);
    setUser(null);
    await deleteSessionToken();
  }, [addAudit, user]);

  const createSubject = useCallback((subjectCode: string, consentStatus: Subject['consentStatus']) => {
    const subject: Subject = { id: `subject-${Date.now()}`, subjectCode: subjectCode.toUpperCase(), consentStatus, qrStatus: 'active', testCount: 0 };
    setSubjects((current) => [subject, ...current]);
    addAudit('create', 'subject', subject.id);
    return subject;
  }, [addAudit]);

  const createTest = useCallback((input: Omit<DrugTest, 'id' | 'testReference' | 'operatorName' | 'createdAt' | 'updatedAt' | 'syncStatus'>, offline = false) => {
    const now = new Date().toISOString();
    const test: DrugTest = { ...input, id: `test-${Date.now()}`, testReference: `ST-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`, operatorName: user?.name ?? 'Demo operator', createdAt: now, updatedAt: now, syncStatus: offline || !isOnline ? 'pending_upload' : 'synced' };
    setTests((current) => [test, ...current]);
    setSubjects((current) => current.map((subject) => subject.id === test.subjectId ? { ...subject, testCount: subject.testCount + 1, lastTestAt: now } : subject));
    addAudit('create', 'drug_test', test.id);
    return test;
  }, [addAudit, isOnline, user?.name]);

  const updateTest = useCallback((id: string, patch: Partial<DrugTest>) => {
    setTests((current) => current.map((test) => test.id === id ? { ...test, ...patch, updatedAt: new Date().toISOString() } : test));
    addAudit('update', 'drug_test', id);
  }, [addAudit]);

  const reviewTest = useCallback((id: string, action: 'approve' | 'reject' | 'inconclusive', note?: string) => {
    const status: TestStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'inconclusive';
    const overallResult: OverallResult | undefined = action === 'inconclusive' ? 'inconclusive' : undefined;
    setTests((current) => current.map((test) => test.id === id ? { ...test, status, reviewerName: user?.name, reviewedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: note || test.notes, ...(overallResult ? { overallResult } : {}) } : test));
    addAudit(`review_${action}`, 'drug_test', id);
  }, [addAudit, user?.name]);

  const clearLocalData = useCallback(async () => {
    await Promise.all([AsyncStorage.removeItem(STORAGE_KEY), deleteSessionToken()]);
    setUser(null);
    setSubjects(seedSubjects);
    setTests(seedTests);
    setAuditLogs([]);
  }, []);

  const value = useMemo<SafeTestContextValue>(() => ({
    hydrated, isAuthenticated: Boolean(user), user, subjects, kits, tests, auditLogs, isOnline, demoMode: true,
    signIn, signOut, createSubject, createTest, updateTest, reviewTest, setOnline, clearLocalData,
  }), [hydrated, user, subjects, kits, tests, auditLogs, isOnline, signIn, signOut, createSubject, createTest, updateTest, reviewTest, clearLocalData]);

  return <SafeTestContext.Provider value={value}>{children}</SafeTestContext.Provider>;
}

export function useSafeTest() {
  const context = useContext(SafeTestContext);
  if (!context) throw new Error('useSafeTest must be used within SafeTestProvider');
  return context;
}