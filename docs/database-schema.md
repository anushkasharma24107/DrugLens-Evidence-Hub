# SafeTest data model

The production persistence layer should use the following collections or relational equivalents. Every record must carry `organizationId` and every query must scope by it.

| Entity | Key fields |
| --- | --- |
| User | id, organizationId, email, role, disabledAt |
| Organization | id, name, settings |
| Subject | id, organizationId, subjectCode, consentStatus, opaqueQrTokenHash, qrRevokedAt |
| TestKit | id, organizationId, manufacturer, version, expiresAt, enabled, panels |
| DrugTest | id, organizationId, testReference, subjectId, kitId, operatorId, reviewerId, status, overallResult, quality, evidence, consent, timestamps |
| DrugPanelResult | id, drugTestId, drug, result, confidence, measuredValue, note, overrideReason |
| EvidenceFile | id, drugTestId, privateObjectKey, sha256, mimeType, size, createdAt |
| Consent | id, organizationId, subjectId, status, capturedBy, capturedAt, revokedAt |
| AuditLog | id, organizationId, actorId, action, resourceType, resourceId, occurredAt, metadata |
| Notification | id, organizationId, recipientId, type, readAt, createdAt |
| Session | id, userId, refreshTokenHash, expiresAt, rotatedAt, revokedAt |

Recommended indexes: `(organizationId, createdAt)`, `(organizationId, subjectId)`, `(organizationId, testReference)`, `(organizationId, status)`, and `(organizationId, operatorId)`. Use soft deletion for user-facing records and retain audit events according to the applicable retention policy.