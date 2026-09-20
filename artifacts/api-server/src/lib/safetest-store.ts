import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";

export type Role = "admin" | "field_operator" | "laboratory_reviewer" | "doctor";
export type TestStatus = "draft" | "pending_upload" | "submitted" | "under_review" | "approved" | "rejected" | "inconclusive" | "archived";
export type OverallResult = "negative" | "presumptive_positive" | "inconclusive" | "not_analyzed";

export type User = { id: string; name: string; email: string; role: Role; organizationId: string; organizationName: string; passwordHash: string };
export type Subject = { id: string; organizationId: string; subjectCode: string; consentStatus: "pending" | "granted" | "revoked"; qrStatus: "active" | "revoked"; testCount: number; lastTestAt?: string };
export type TestKit = { id: string; organizationId: string; name: string; manufacturer: string; version: string; expiresAt: string; enabled: boolean; panels: string[] };
export type PanelResult = { drug: string; result: "negative" | "presumptive_positive" | "inconclusive"; confidence: number; note?: string };
export type DrugTest = { id: string; organizationId: string; testReference: string; subjectId: string; subjectCode: string; kitId: string; kitName: string; operatorId: string; operatorName: string; reviewerId?: string; reviewerName?: string; status: TestStatus; overallResult: OverallResult; panelResults: PanelResult[]; imageQualityScore: number; imageHash?: string; evidenceFileUrl?: string; notes?: string; location?: string; consentStatus: string; syncStatus: "synced" | "pending_upload" | "failed"; createdAt: string; updatedAt: string; reviewedAt?: string };
export type AuditLog = { id: string; organizationId: string; action: string; actorName: string; resourceType: string; resourceId: string; occurredAt: string };

export const users: User[] = [
  { id: "user-admin", name: "Avery Morgan", email: "admin@demo.safetest", role: "admin", organizationId: "org-northstar", organizationName: "Northstar Community Health", passwordHash: bcrypt.hashSync("demo-password", 10) },
  { id: "user-operator", name: "Jordan Lee", email: "operator@demo.safetest", role: "field_operator", organizationId: "org-northstar", organizationName: "Northstar Community Health", passwordHash: bcrypt.hashSync("demo-password", 10) },
  { id: "user-reviewer", name: "Dr. Casey Patel", email: "reviewer@demo.safetest", role: "laboratory_reviewer", organizationId: "org-northstar", organizationName: "Northstar Community Health", passwordHash: bcrypt.hashSync("demo-password", 10) },
  { id: "user-doctor", name: "Dr. Sam Rivera", email: "doctor@demo.safetest", role: "doctor", organizationId: "org-northstar", organizationName: "Northstar Community Health", passwordHash: bcrypt.hashSync("demo-password", 10) },
];

export const subjects: Subject[] = [
  { id: "subject-2048", organizationId: "org-northstar", subjectCode: "ST-2048", consentStatus: "granted", qrStatus: "active", testCount: 4, lastTestAt: "2026-09-19T08:30:00.000Z" },
  { id: "subject-3914", organizationId: "org-northstar", subjectCode: "ST-3914", consentStatus: "granted", qrStatus: "active", testCount: 2, lastTestAt: "2026-09-17T15:10:00.000Z" },
];

export const kits: TestKit[] = [
  { id: "kit-5panel", organizationId: "org-northstar", name: "RapidCheck 5-Panel", manufacturer: "ClearPath Diagnostics", version: "v2.4", expiresAt: "2027-04-30", enabled: true, panels: ["THC", "COC", "OPI", "AMP", "BZO"] },
  { id: "kit-10panel", organizationId: "org-northstar", name: "RapidCheck 10-Panel", manufacturer: "ClearPath Diagnostics", version: "v1.9", expiresAt: "2026-12-15", enabled: true, panels: ["THC", "COC", "OPI", "AMP", "BZO", "MET", "MTD", "BAR", "TCA", "OXY"] },
];

export const tests: DrugTest[] = [
  { id: "test-10084", organizationId: "org-northstar", testReference: "ST-2026-10084", subjectId: "subject-2048", subjectCode: "ST-2048", kitId: "kit-5panel", kitName: "RapidCheck 5-Panel", operatorId: "user-operator", operatorName: "Jordan Lee", reviewerId: "user-reviewer", reviewerName: "Dr. Casey Patel", status: "approved", overallResult: "negative", panelResults: ["THC", "COC", "OPI", "AMP", "BZO"].map((drug) => ({ drug, result: "negative", confidence: 0.98 })), imageQualityScore: 94, imageHash: "sha256:7f9b…c831", consentStatus: "granted", syncStatus: "synced", createdAt: "2026-09-19T08:30:00.000Z", updatedAt: "2026-09-19T09:14:00.000Z", reviewedAt: "2026-09-19T09:14:00.000Z" },
  { id: "test-10083", organizationId: "org-northstar", testReference: "ST-2026-10083", subjectId: "subject-3914", subjectCode: "ST-3914", kitId: "kit-10panel", kitName: "RapidCheck 10-Panel", operatorId: "user-operator", operatorName: "Jordan Lee", status: "under_review", overallResult: "presumptive_positive", panelResults: [{ drug: "THC", result: "presumptive_positive", confidence: 0.76 }, { drug: "COC", result: "negative", confidence: 0.95 }], imageQualityScore: 88, imageHash: "sha256:8a16…d102", consentStatus: "granted", syncStatus: "synced", createdAt: "2026-09-18T15:10:00.000Z", updatedAt: "2026-09-18T15:18:00.000Z" },
];

export const auditLogs: AuditLog[] = [];
export const sessions = new Map<string, string>();

export function publicUser(user: User) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export function createSession(userId: string) {
  const accessToken = randomUUID();
  sessions.set(accessToken, userId);
  return { accessToken, refreshToken: createHash("sha256").update(`${accessToken}:${randomUUID()}`).digest("hex") };
}

export function findUserByToken(token: string | undefined) {
  const userId = token ? sessions.get(token) : undefined;
  return users.find((user) => user.id === userId);
}

export function addAudit(user: User, action: string, resourceType: string, resourceId: string) {
  auditLogs.unshift({ id: randomUUID(), organizationId: user.organizationId, action, actorName: user.name, resourceType, resourceId, occurredAt: new Date().toISOString() });
  auditLogs.splice(100);
}

export function checkPassword(user: User, password: string) {
  return bcrypt.compareSync(password, user.passwordHash);
}