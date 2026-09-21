import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createSession, publicUser, rotateSession, sessions, type DrugTest, type Role, type User } from "../lib/safetest-store";
import { findUserByEmail, findUserById, getDashboard, getKit, getSubject, getTest, createSubject, createTest, incrementSubjectTestCount, listAuditLogs, listKits, listSubjects, listTests, recordAudit, updateTest } from "../db/repository";

type AuthedRequest = Request & { user?: User };
const router: IRouter = Router();

const userShape = z.object({ id: z.string(), name: z.string(), email: z.string(), role: z.enum(["admin", "field_operator", "laboratory_reviewer", "doctor"]), organizationId: z.string(), organizationName: z.string() });
const panelShape = z.object({ drug: z.string().min(1), result: z.enum(["negative", "presumptive_positive", "inconclusive"]), confidence: z.number().min(0).max(1), note: z.string().optional() });
const imageLocationShape = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(100000).optional(),
}).optional();

const requireAuth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    const userId = token ? sessions.get(token) : undefined;
    const user = userId ? await findUserById(userId) : null;
    if (!user) return res.status(401).json({ message: "Authentication required" });
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireRole = (...roles: Role[]) => (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: "You do not have access to this resource" });
  return next();
};

const safeTest = (test: DrugTest) => {
  const { organizationId: _organizationId, operatorId: _operatorId, reviewerId: _reviewerId, ...safe } = test;
  return safe;
};

const safeSubject = (subject: Awaited<ReturnType<typeof getSubject>>) => {
  if (!subject) return subject;
  const { organizationId: _organizationId, ...safe } = subject;
  return safe;
};

router.post("/auth/login", async (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid sign-in request" });
  const user = await findUserByEmail(parsed.data.email);
  if (!user) return res.status(401).json({ message: "Invalid email or password" });
  const { checkPassword } = await import("../lib/safetest-store");
  if (!checkPassword(user, parsed.data.password)) return res.status(401).json({ message: "Invalid email or password" });
  await recordAudit(user, "login", "session", user.id);
  return res.json({ ...createSession(user.id), user: userShape.parse(publicUser(user)) });
});

router.get("/auth/me", requireAuth, (req: AuthedRequest, res) => res.json(userShape.parse(publicUser(req.user!))));

router.post("/auth/logout", requireAuth, async (req: AuthedRequest, res) => {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (token) {
    sessions.delete(token);
    await recordAudit(req.user!, "logout", "session", req.user!.id);
  }
  return res.status(204).send();
});

router.post("/auth/refresh", async (req, res) => {
  const parsed = z.object({ refreshToken: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid refresh request" });
  const rotated = rotateSession(parsed.data.refreshToken);
  if (!rotated) return res.status(401).json({ message: "Refresh session is invalid or expired" });
  const user = await findUserById(rotated.userId);
  if (!user) return res.status(401).json({ message: "Refresh session is invalid or expired" });
  return res.json({ accessToken: rotated.accessToken, refreshToken: rotated.refreshToken, user: userShape.parse(publicUser(user)) });
});

router.get("/dashboard", requireAuth, async (req: AuthedRequest, res) => {
  const dashboard = await getDashboard(req.user!.organizationId, req.user!.role, req.user!.id);
  return res.json({ ...dashboard, recentTests: dashboard.recentTests.map(safeTest) });
});

router.get("/subjects", requireAuth, async (req: AuthedRequest, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : "";
  const records = await listSubjects(req.user!.organizationId, search);
  return res.json(records.map((subject) => safeSubject(subject)));
});

router.post("/subjects", requireAuth, requireRole("admin", "field_operator"), async (req: AuthedRequest, res) => {
  const parsed = z.object({ subjectCode: z.string().regex(/^ST-\d{4,}$/i), consentStatus: z.enum(["pending", "granted", "revoked"]).default("pending") }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid subject request" });
  const subject = await createSubject({ id: `subject-${randomUUID()}`, organizationId: req.user!.organizationId, subjectCode: parsed.data.subjectCode.toUpperCase(), consentStatus: parsed.data.consentStatus, qrStatus: "active", testCount: 0 });
  await recordAudit(req.user!, "create", "subject", subject.id);
  return res.status(201).json(safeSubject(subject));
});

router.get("/test-kits", requireAuth, async (req: AuthedRequest, res) => {
  const records = await listKits(req.user!.organizationId);
  return res.json(records.map(({ organizationId: _organizationId, ...safe }) => safe));
});

router.get("/tests", requireAuth, async (req: AuthedRequest, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const records = await listTests(req.user!.organizationId, req.user!.role, req.user!.id, search, status);
  return res.json(records.map(safeTest));
});

router.post("/tests", requireAuth, requireRole("admin", "field_operator"), async (req: AuthedRequest, res) => {
  const parsed = z.object({
    subjectId: z.string(),
    kitId: z.string(),
    overallResult: z.enum(["negative", "presumptive_positive", "inconclusive", "not_analyzed"]),
    panelResults: z.array(panelShape),
    imageQualityScore: z.number().min(0).max(100),
    imageHash: z.string().max(256).optional(),
    evidenceFileUrl: z.string().url().max(2000).optional(),
    notes: z.string().max(5000).optional(),
    location: z.string().max(300).optional(),
    imageTakenAt: z.coerce.date().optional(),
    imageLocation: imageLocationShape,
    imagePlace: z.string().max(300).optional(),
    consentStatus: z.enum(["pending", "granted", "revoked"]),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid test request", issues: parsed.error.issues });
  const subject = await getSubject(parsed.data.subjectId, req.user!.organizationId);
  const kit = await getKit(parsed.data.kitId, req.user!.organizationId);
  if (!subject || subject.consentStatus !== "granted" || parsed.data.consentStatus !== "granted" || !kit) return res.status(400).json({ message: "Subject consent or kit is unavailable" });
  const now = new Date().toISOString();
  const test: DrugTest = {
    id: `test-${randomUUID()}`,
    organizationId: req.user!.organizationId,
    testReference: `ST-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`,
    subjectId: subject.id,
    subjectCode: subject.subjectCode,
    kitId: kit.id,
    kitName: kit.name,
    operatorId: req.user!.id,
    operatorName: req.user!.name,
    status: "draft",
    overallResult: parsed.data.overallResult,
    panelResults: parsed.data.panelResults,
    imageQualityScore: parsed.data.imageQualityScore,
    imageHash: parsed.data.imageHash,
    evidenceFileUrl: parsed.data.evidenceFileUrl,
    notes: parsed.data.notes,
    location: parsed.data.location,
    imageTakenAt: parsed.data.imageTakenAt?.toISOString(),
    imageLocation: parsed.data.imageLocation,
    imagePlace: parsed.data.imagePlace,
    consentStatus: parsed.data.consentStatus,
    syncStatus: "synced",
    createdAt: now,
    updatedAt: now,
  };
  await createTest(test);
  await incrementSubjectTestCount(subject.id, req.user!.organizationId, now);
  await recordAudit(req.user!, "create", "drug_test", test.id);
  return res.status(201).json(safeTest(test));
});

router.get("/tests/:id", requireAuth, async (req: AuthedRequest, res) => {
  const test = await getTest(String(req.params.id), req.user!.organizationId, req.user!.role, req.user!.id);
  return test ? res.json(safeTest(test)) : res.status(404).json({ message: "Test record not found" });
});

router.post("/tests/:id/submit", requireAuth, requireRole("admin", "field_operator"), async (req: AuthedRequest, res) => {
  const test = await getTest(String(req.params.id), req.user!.organizationId, req.user!.role, req.user!.id);
  if (!test) return res.status(404).json({ message: "Test record not found" });
  const updated = await updateTest(test.id, req.user!.organizationId, { status: "submitted", updatedAt: new Date().toISOString() });
  await recordAudit(req.user!, "submit", "drug_test", test.id);
  return res.json(safeTest(updated ?? { ...test, status: "submitted" }));
});

router.post("/tests/:id/review", requireAuth, requireRole("admin", "laboratory_reviewer"), async (req: AuthedRequest, res) => {
  const parsed = z.object({ action: z.enum(["approve", "reject", "inconclusive"]), note: z.string().max(5000).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid review request" });
  const test = await getTest(String(req.params.id), req.user!.organizationId, req.user!.role, req.user!.id);
  if (!test) return res.status(404).json({ message: "Test record not found" });
  const reviewedAt = new Date().toISOString();
  const updated = await updateTest(test.id, req.user!.organizationId, {
    status: parsed.data.action === "approve" ? "approved" : parsed.data.action === "reject" ? "rejected" : "inconclusive",
    overallResult: parsed.data.action === "inconclusive" ? "inconclusive" : test.overallResult,
    reviewerId: req.user!.id,
    reviewerName: req.user!.name,
    notes: parsed.data.note ?? test.notes,
    reviewedAt,
    updatedAt: reviewedAt,
  });
  await recordAudit(req.user!, `review_${parsed.data.action}`, "drug_test", test.id);
  return res.json(safeTest(updated ?? test));
});

router.get("/audit-logs", requireAuth, requireRole("admin"), async (req: AuthedRequest, res) => {
  const records = await listAuditLogs(req.user!.organizationId);
  return res.json(records);
});

export default router;