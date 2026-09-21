import mongoose, { Schema, type Model } from "mongoose";

const panelResultSchema = new Schema(
  {
    drug: { type: String, required: true, trim: true, minlength: 1 },
    result: { type: String, enum: ["negative", "presumptive_positive", "inconclusive"], required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    note: { type: String, trim: true, maxlength: 2000 },
  },
  { _id: false },
);

const imageLocationSchema = new Schema(
  {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    accuracyMeters: { type: Number, min: 0, max: 100000 },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ["admin", "field_operator", "laboratory_reviewer", "doctor"], required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    organizationName: { type: String, required: true, trim: true, maxlength: 200 },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true, versionKey: false },
);
userSchema.index({ organizationId: 1, role: 1 });

const subjectSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
    subjectCode: { type: String, required: true, uppercase: true, trim: true, match: /^ST-\d{4,}$/i },
    consentStatus: { type: String, enum: ["pending", "granted", "revoked"], required: true, default: "pending" },
    qrStatus: { type: String, enum: ["active", "revoked"], required: true, default: "active" },
    testCount: { type: Number, required: true, min: 0, default: 0 },
    lastTestAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);
subjectSchema.index({ organizationId: 1, subjectCode: 1 }, { unique: true });

const testKitSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    manufacturer: { type: String, required: true, trim: true, maxlength: 200 },
    version: { type: String, required: true, trim: true, maxlength: 80 },
    expiresAt: { type: Date, required: true, index: true },
    enabled: { type: Boolean, required: true, default: true, index: true },
    panels: { type: [String], required: true, validate: [(value: string[]) => value.length > 0, "At least one panel is required"] },
  },
  { timestamps: true, versionKey: false },
);
testKitSchema.index({ organizationId: 1, enabled: 1, expiresAt: 1 });

const drugTestSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
    testReference: { type: String, required: true, unique: true, index: true },
    subjectId: { type: String, required: true, index: true },
    subjectCode: { type: String, required: true, trim: true },
    kitId: { type: String, required: true, index: true },
    kitName: { type: String, required: true, trim: true },
    operatorId: { type: String, required: true, index: true },
    operatorName: { type: String, required: true, trim: true },
    reviewerId: { type: String, index: true },
    reviewerName: { type: String, trim: true },
    status: { type: String, enum: ["draft", "pending_upload", "submitted", "under_review", "approved", "rejected", "inconclusive", "archived"], required: true, index: true },
    overallResult: { type: String, enum: ["negative", "presumptive_positive", "inconclusive", "not_analyzed"], required: true },
    panelResults: { type: [panelResultSchema], required: true },
    imageQualityScore: { type: Number, required: true, min: 0, max: 100 },
    imageHash: { type: String, trim: true, maxlength: 256 },
    evidenceFileUrl: { type: String, trim: true, maxlength: 2000 },
    notes: { type: String, trim: true, maxlength: 5000 },
    location: { type: String, trim: true, maxlength: 300 },
    imageTakenAt: { type: Date },
    imageLocation: { type: imageLocationSchema },
    imagePlace: { type: String, trim: true, maxlength: 300 },
    consentStatus: { type: String, enum: ["pending", "granted", "revoked"], required: true },
    syncStatus: { type: String, enum: ["synced", "pending_upload", "failed"], required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    reviewedAt: { type: Date },
  },
  { versionKey: false },
);
drugTestSchema.index({ organizationId: 1, createdAt: -1 });
drugTestSchema.index({ organizationId: 1, status: 1, updatedAt: -1 });
drugTestSchema.index({ organizationId: 1, operatorId: 1, createdAt: -1 });

const auditLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
    action: { type: String, required: true, trim: true, maxlength: 120 },
    actorName: { type: String, required: true, trim: true, maxlength: 200 },
    resourceType: { type: String, required: true, trim: true, maxlength: 120 },
    resourceId: { type: String, required: true, trim: true, maxlength: 200 },
    occurredAt: { type: Date, required: true, index: true },
  },
  { versionKey: false },
);
auditLogSchema.index({ organizationId: 1, occurredAt: -1 });

export type UserDocument = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "field_operator" | "laboratory_reviewer" | "doctor";
  organizationId: string;
  organizationName: string;
  passwordHash: string;
};

export const UserModel = (mongoose.models.User as Model<UserDocument> | undefined) ?? mongoose.model<UserDocument>("User", userSchema);
export const SubjectModel = mongoose.models.Subject ?? mongoose.model("Subject", subjectSchema);
export const TestKitModel = mongoose.models.TestKit ?? mongoose.model("TestKit", testKitSchema);
export const DrugTestModel = mongoose.models.DrugTest ?? mongoose.model("DrugTest", drugTestSchema);
export const AuditLogModel = mongoose.models.AuditLog ?? mongoose.model("AuditLog", auditLogSchema);