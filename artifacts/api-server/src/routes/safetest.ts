import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { addAudit, auditLogs, checkPassword, createSession, findUserByToken, kits, publicUser, subjects, tests, users, type Role, type User } from "../lib/safetest-store";

type AuthedRequest = Request & { user?: User };
const router: IRouter = Router();

const userShape = z.object({ id: z.string(), name: z.string(), email: z.string(), role: z.enum(["admin", "field_operator", "laboratory_reviewer", "doctor"]), organizationId: z.string(), organizationName: z.string() });
const panelShape = z.object({ drug: z.string().min(1), result: z.enum(["negative", "presumptive_positive", "inconclusive"]), confidence: z.number().min(0).max(1), note: z.string().optional() });
const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  const user = findUserByToken(token);
  if (!user) return res.status(401).json({ message: "Authentication required" });
  req.user = user;
  return next();
};
const requireRole = (...roles: Role[]) => (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: "You do not have access to this resource" });
  return next();
};
const safeTest = (test: (typeof tests)[number]) => {
  const { organizationId: _organizationId, operatorId: _operatorId, reviewerId: _reviewerId, ...safe } = test;
  return safe;
};

router.post("/auth/login", (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid sign-in request" });
  const user = users.find((candidate) => candidate.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (!user || !checkPassword(user, parsed.data.password)) return res.status(401).json({ message: "Invalid email or password" });
  addAudit(user, "login", "session", user.id);
  return res.json({ ...createSession(user.id), user: userShape.parse(publicUser(user)) });
});

router.get("/auth/me", requireAuth, (req: AuthedRequest, res) => res.json(userShape.parse(publicUser(req.user!))));
router.post("/auth/logout", requireAuth, (req: AuthedRequest, res) => { const token = req.header("authorization")?.replace(/^Bearer\s+/i, ""); if (token) { const sessionUser = req.user!; addAudit(sessionUser, "logout", "session", sessionUser.id); } return res.status(204).send(); });
router.post("/auth/refresh", (req, res) => res.status(501).json({ message: "Refresh rotation is provided by the production auth provider." }));

router.get("/dashboard", requireAuth, (req: AuthedRequest, res) => {
  const scoped = tests.filter((test) => test.organizationId === req.user!.organizationId && (req.user!.role !== "field_operator" || test.operatorId === req.user!.id));
  return res.json({ totalTests: scoped.length, completedToday: scoped.filter((test) => test.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length, pendingReviews: scoped.filter((test) => ["submitted", "under_review"].includes(test.status)).length, inconclusive: scoped.filter((test) => test.status === "inconclusive").length, recentTests: scoped.slice(0, 5).map(safeTest) });
});

router.get("/subjects", requireAuth, (req: AuthedRequest, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : "";
  return res.json(subjects.filter((subject) => subject.organizationId === req.user!.organizationId && (!search || subject.subjectCode.toLowerCase().includes(search))).map(({ organizationId: _organizationId, ...safe }) => safe));
});

router.post("/subjects", requireAuth, requireRole("admin", "field_operator"), (req: AuthedRequest, res) => {
  const parsed = z.object({ subjectCode: z.string().regex(/^ST-\d{4,}$/i), consentStatus: z.enum(["pending", "granted", "revoked"]).default("pending") }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid subject request" });
  const subject = { id: `subject-${Date.now()}`, organizationId: req.user!.organizationId, subjectCode: parsed.data.subjectCode.toUpperCase(), consentStatus: parsed.data.consentStatus, qrStatus: "active" as const, testCount: 0 };
  subjects.unshift(subject);
  addAudit(req.user!, "create", "subject", subject.id);
  const { organizationId: _organizationId, ...safe } = subject;
  return res.status(201).json(safe);
});

router.get("/test-kits", requireAuth, (req: AuthedRequest, res) => res.json(kits.filter((kit) => kit.organizationId === req.user!.organizationId).map(({ organizationId: _organizationId, ...safe }) => safe)));

router.get("/tests", requireAuth, (req: AuthedRequest, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const scoped = tests.filter((test) => test.organizationId === req.user!.organizationId && (req.user!.role !== "field_operator" || test.operatorId === req.user!.id) && (!status || test.status === status) && (!search || `${test.testReference} ${test.subjectCode} ${test.kitName}`.toLowerCase().includes(search)));
  return res.json(scoped.map(safeTest));
});

router.post("/tests", requireAuth, requireRole("admin", "field_operator"), (req: AuthedRequest, res) => {
  const parsed = z.object({ subjectId: z.string(), kitId: z.string(), overallResult: z.enum(["negative", "presumptive_positive", "inconclusive", "not_analyzed"]), panelResults: z.array(panelShape), imageQualityScore: z.number().min(0).max(100), imageHash: z.string().optional(), notes: z.string().optional(), consentStatus: z.string() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid test request" });
  const subject = subjects.find((candidate) => candidate.id === parsed.data.subjectId && candidate.organizationId === req.user!.organizationId);
  const kit = kits.find((candidate) => candidate.id === parsed.data.kitId && candidate.organizationId === req.user!.organizationId && candidate.enabled && new Date(candidate.expiresAt) >= new Date());
  if (!subject || !kit) return res.status(400).json({ message: "Subject or kit is unavailable" });
  const now = new Date().toISOString();
  const test = { id: `test-${Date.now()}`, organizationId: req.user!.organizationId, testReference: `ST-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`, subjectId: subject.id, subjectCode: subject.subjectCode, kitId: kit.id, kitName: kit.name, operatorId: req.user!.id, operatorName: req.user!.name, status: "draft" as const, overallResult: parsed.data.overallResult, panelResults: parsed.data.panelResults, imageQualityScore: parsed.data.imageQualityScore, imageHash: parsed.data.imageHash, notes: parsed.data.notes, consentStatus: parsed.data.consentStatus, syncStatus: "synced" as const, createdAt: now, updatedAt: now };
  tests.unshift(test);
  subject.testCount += 1;
  subject.lastTestAt = now;
  addAudit(req.user!, "create", "drug_test", test.id);
  return res.status(201).json(safeTest(test));
});

router.get("/tests/:id", requireAuth, (req: AuthedRequest, res) => {
  const test = tests.find((candidate) => candidate.id === req.params.id && candidate.organizationId === req.user!.organizationId && (req.user!.role !== "field_operator" || candidate.operatorId === req.user!.id));
  return test ? res.json(safeTest(test)) : res.status(404).json({ message: "Test record not found" });
});

router.post("/tests/:id/submit", requireAuth, requireRole("admin", "field_operator"), (req: AuthedRequest, res) => {
  const test = tests.find((candidate) => candidate.id === req.params.id && candidate.organizationId === req.user!.organizationId && (req.user!.role !== "field_operator" || candidate.operatorId === req.user!.id));
  if (!test) return res.status(404).json({ message: "Test record not found" });
  test.status = "submitted";
  test.updatedAt = new Date().toISOString();
  addAudit(req.user!, "submit", "drug_test", test.id);
  return res.json(safeTest(test));
});

router.post("/tests/:id/review", requireAuth, requireRole("admin", "laboratory_reviewer"), (req: AuthedRequest, res) => {
  const parsed = z.object({ action: z.enum(["approve", "reject", "inconclusive"]), note: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid review request" });
  const test = tests.find((candidate) => candidate.id === req.params.id && candidate.organizationId === req.user!.organizationId);
  if (!test) return res.status(404).json({ message: "Test record not found" });
  test.status = parsed.data.action === "approve" ? "approved" : parsed.data.action === "reject" ? "rejected" : "inconclusive";
  test.overallResult = parsed.data.action === "inconclusive" ? "inconclusive" : test.overallResult;
  test.reviewerId = req.user!.id;
  test.reviewerName = req.user!.name;
  test.notes = parsed.data.note ?? test.notes;
  test.reviewedAt = new Date().toISOString();
  test.updatedAt = test.reviewedAt;
  addAudit(req.user!, `review_${parsed.data.action}`, "drug_test", test.id);
  return res.json(safeTest(test));
});

router.get("/audit-logs", requireAuth, requireRole("admin"), (req: AuthedRequest, res) => res.json(auditLogs.filter((log) => log.organizationId === req.user!.organizationId)));

export default router;