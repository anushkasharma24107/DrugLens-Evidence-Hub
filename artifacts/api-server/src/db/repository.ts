import { randomUUID } from "node:crypto";
import { addAudit, auditLogs, kits, subjects, tests, users, type AuditLog, type DrugTest, type Role, type Subject, type TestKit, type User } from "../lib/safetest-store";
import { assertDatabaseAvailable, getDatabaseHealth } from "./mongo";
import { AuditLogModel, DrugTestModel, SubjectModel, TestKitModel, UserModel } from "./models";

function usingMongo() {
  return getDatabaseHealth().status === "ready";
}

function plain<T>(value: T): T {
  if (value instanceof Date) return value.toISOString() as T;
  if (Array.isArray(value)) return value.map((item) => plain(item)) as T;
  if (!value || typeof value !== "object") return value;
  const record = value as T & { _id?: unknown };
  const { _id: _ignored, ...rest } = record as T & { _id?: unknown };
  return Object.fromEntries(Object.entries(rest).map(([key, item]) => [key, plain(item)])) as T;
}

function memoryOrThrow() {
  assertDatabaseAvailable();
  return !usingMongo();
}

export async function findUserByEmail(email: string): Promise<User | null> {
  if (memoryOrThrow()) return users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase()) ?? null;
  return plain(await UserModel.findOne({ email: email.toLowerCase() }).select("+passwordHash").lean().exec()) as User | null;
}

export async function findUserById(id: string): Promise<User | null> {
  if (memoryOrThrow()) return users.find((candidate) => candidate.id === id) ?? null;
  return plain(await UserModel.findOne({ id }).select("+passwordHash").lean().exec()) as User | null;
}

export async function listSubjects(organizationId: string, search: string) {
  if (memoryOrThrow()) return subjects.filter((subject) => subject.organizationId === organizationId && (!search || subject.subjectCode.toLowerCase().includes(search)));
  return (await SubjectModel.find({ organizationId, ...(search ? { subjectCode: { $regex: search, $options: "i" } } : {}) }).sort({ subjectCode: 1 }).lean().exec()).map(plain) as Subject[];
}

export async function createSubject(subject: Subject) {
  if (memoryOrThrow()) {
    subjects.unshift(subject);
    return subject;
  }
  return plain(await SubjectModel.create(subject)) as Subject;
}

export async function listKits(organizationId: string) {
  if (memoryOrThrow()) return kits.filter((kit) => kit.organizationId === organizationId);
  return (await TestKitModel.find({ organizationId }).sort({ expiresAt: 1 }).lean().exec()).map(plain) as TestKit[];
}

export async function getSubject(subjectId: string, organizationId: string) {
  if (memoryOrThrow()) return subjects.find((subject) => subject.id === subjectId && subject.organizationId === organizationId) ?? null;
  return plain(await SubjectModel.findOne({ id: subjectId, organizationId }).lean().exec()) as Subject | null;
}

export async function getKit(kitId: string, organizationId: string) {
  if (memoryOrThrow()) return kits.find((kit) => kit.id === kitId && kit.organizationId === organizationId && kit.enabled && new Date(kit.expiresAt) >= new Date()) ?? null;
  return plain(await TestKitModel.findOne({ id: kitId, organizationId, enabled: true, expiresAt: { $gte: new Date() } }).lean().exec()) as TestKit | null;
}

export async function incrementSubjectTestCount(subjectId: string, organizationId: string, lastTestAt: string) {
  if (memoryOrThrow()) {
    const subject = subjects.find((candidate) => candidate.id === subjectId && candidate.organizationId === organizationId);
    if (subject) {
      subject.testCount += 1;
      subject.lastTestAt = lastTestAt;
    }
    return;
  }
  await SubjectModel.updateOne({ id: subjectId, organizationId }, { $inc: { testCount: 1 }, $set: { lastTestAt: new Date(lastTestAt) } }).exec();
}

function canSeeTest(test: DrugTest, organizationId: string, role: Role, userId: string) {
  return test.organizationId === organizationId && (role !== "field_operator" || test.operatorId === userId);
}

export async function listTests(organizationId: string, role: Role, userId: string, search: string, status: string) {
  if (memoryOrThrow()) return tests.filter((test) => canSeeTest(test, organizationId, role, userId) && (!status || test.status === status) && (!search || `${test.testReference} ${test.subjectCode} ${test.kitName}`.toLowerCase().includes(search)));
  const filter = {
    organizationId,
    ...(role === "field_operator" ? { operatorId: userId } : {}),
    ...(status ? { status } : {}),
    ...(search ? { $or: [{ testReference: { $regex: search, $options: "i" } }, { subjectCode: { $regex: search, $options: "i" } }, { kitName: { $regex: search, $options: "i" } }] } : {}),
  };
  return (await DrugTestModel.find(filter).sort({ createdAt: -1 }).lean().exec()).map(plain) as DrugTest[];
}

export async function getTest(id: string, organizationId: string, role: Role, userId: string) {
  if (memoryOrThrow()) return tests.find((test) => test.id === id && canSeeTest(test, organizationId, role, userId)) ?? null;
  return plain(await DrugTestModel.findOne({ id, organizationId, ...(role === "field_operator" ? { operatorId: userId } : {}) }).lean().exec()) as DrugTest | null;
}

export async function createTest(test: DrugTest) {
  if (memoryOrThrow()) {
    tests.unshift(test);
    return test;
  }
  return plain(await DrugTestModel.create(test)) as DrugTest;
}

export async function updateTest(id: string, organizationId: string, patch: Partial<DrugTest>) {
  if (memoryOrThrow()) {
    const test = tests.find((candidate) => candidate.id === id && candidate.organizationId === organizationId);
    if (!test) return null;
    Object.assign(test, patch);
    return test;
  }
  return plain(await DrugTestModel.findOneAndUpdate({ id, organizationId }, { $set: patch }, { new: true, runValidators: true }).lean().exec()) as DrugTest | null;
}

export async function getDashboard(organizationId: string, role: Role, userId: string) {
  const records = await listTests(organizationId, role, userId, "", "");
  const today = new Date().toISOString().slice(0, 10);
  return {
    totalTests: records.length,
    completedToday: records.filter((test) => test.createdAt.slice(0, 10) === today).length,
    pendingReviews: records.filter((test) => ["submitted", "under_review"].includes(test.status)).length,
    inconclusive: records.filter((test) => test.status === "inconclusive").length,
    recentTests: records.slice(0, 5),
  };
}

export async function listAuditLogs(organizationId: string) {
  if (memoryOrThrow()) return auditLogs.filter((log) => log.organizationId === organizationId);
  return (await AuditLogModel.find({ organizationId }).sort({ occurredAt: -1 }).limit(100).lean().exec()).map(plain) as AuditLog[];
}

export async function recordAudit(user: User, action: string, resourceType: string, resourceId: string) {
  if (memoryOrThrow()) {
    addAudit(user, action, resourceType, resourceId);
    return;
  }
  await AuditLogModel.create({ id: randomUUID(), organizationId: user.organizationId, action, actorName: user.name, resourceType, resourceId, occurredAt: new Date() });
}