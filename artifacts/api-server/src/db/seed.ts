import { UserModel, SubjectModel, TestKitModel, DrugTestModel, AuditLogModel } from "./models";
import { auditLogs, kits, subjects, tests, users } from "../lib/safetest-store";

export async function seedMongoDatabase() {
  await Promise.all([
    ...users.map((user) => UserModel.updateOne({ id: user.id }, { $set: user }, { upsert: true })),
    ...subjects.map((subject) => SubjectModel.updateOne({ id: subject.id }, { $set: subject }, { upsert: true })),
    ...kits.map((kit) => TestKitModel.updateOne({ id: kit.id }, { $set: kit }, { upsert: true })),
    ...tests.map((test) => DrugTestModel.updateOne({ id: test.id }, { $set: test }, { upsert: true })),
    ...auditLogs.map((log) => AuditLogModel.updateOne({ id: log.id }, { $set: log }, { upsert: true })),
  ]);
}