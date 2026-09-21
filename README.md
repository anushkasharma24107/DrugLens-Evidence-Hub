# Drug Lense

Drug Lense is a cross-platform Expo React Native application for field drug-test kit management and auditable preliminary screening records. It helps field operators capture evidence, assess image quality, record panel observations, and route tests to laboratory reviewers without presenting a screening result as a legally confirmed diagnosis.

> **Screening result only. Confirm important or legally relevant results through an accredited laboratory.**

## What is included

- Expo Router mobile app for Android, iOS, and web preview.
- Welcome/onboarding and role-aware demo sign-in.
- Admin, field operator, laboratory reviewer, and doctor/authorized viewer role surfaces.
- Organization-scoped subjects, test kits, tests, audit events, and review actions.
- Guided five-step new test flow with device camera permission, gallery upload, kit expiry checks, consent visibility, deterministic demo image-quality assessment, panel results, notes, and preliminary-result confirmation.
- Test history search and filters.
- Test detail evidence record with panel results, image hash, sync state, reviewer actions, and audit timeline.
- Offline draft indicator and local secure session storage.
- Express TypeScript API with protected routes, bcrypt password hashing for demo accounts, role middleware, organization isolation, rate-limited sign-in, Helmet, and a repository-shaped in-memory store.

## Demo access

The mobile app is explicitly labeled **Demo environment** and uses fake records. Select a role on the sign-in screen. The API demo users use:

- `admin@demo.druglense`
- `operator@demo.druglense`
- `reviewer@demo.druglense`
- `doctor@demo.druglense`

Demo password: `demo-password`

Do not use these credentials or the in-memory store for real patient data.

## Run locally

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/safetest run dev
```

Run `pnpm run typecheck` for the full TypeScript check. The mobile workflow is the supported Expo preview path; use Preview on your phone to open the project with Expo Go.

## Environment

See `.env.example`. The server requires `PORT` from the managed workflow and should use `SESSION_SECRET` in any non-demo environment. The mobile app receives `EXPO_PUBLIC_DOMAIN` from the managed workflow and does not hardcode an API host.

## Architecture

See:

- `docs/architecture.md`
- `docs/database-schema.md`
- `docs/api.md`
- `.env.example`

## Known limitations before healthcare use

- The current repository is an in-memory development repository; MongoDB Atlas, private object storage, signed evidence URLs, refresh-token persistence, and production identity-provider setup are not yet wired.
- Demo image-quality assessment is deterministic and not medical-grade AI.
- The current camera capture UI uses Expo Camera permission and preview; a device build should wire the camera ref to the native capture method and add device-level image hashing before production rollout.
- Notifications, QR token resolution, location capture, and report export are represented by role-aware UI states and must be connected to audited production services.
- A clinical, legal, privacy, and security review is required before processing real records.

## Security checklist

- [x] Do not put patient names, results, or medical data in QR content.
- [x] Role and organization checks exist on API routes.
- [x] Passwords are hashed with bcrypt in the demo repository.
- [x] Request validation uses Zod.
- [x] Sign-in rate limiting and Helmet are enabled.
- [x] Audit events are created for authentication, subject creation, test creation, submissions, and reviews.
- [ ] Replace in-memory sessions with a managed production auth provider and persistent refresh-token rotation.
- [ ] Add private object storage and signed URLs for evidence files.
- [ ] Add dependency, SAST, privacy, threat-model, and penetration reviews.# Drug Lense

Drug Lense is a cross-platform Expo React Native application for field drug-test kit management and auditable preliminary screening records. It helps field operators capture evidence, assess image quality, record panel observations, and route tests to laboratory reviewers without presenting a screening result as a legally confirmed diagnosis.

> **Screening result only. Confirm important or legally relevant results through an accredited laboratory.**

## What is included

- Expo Router mobile app for Android, iOS, and web preview.
- Welcome/onboarding and role-aware demo sign-in.
- Admin, field operator, laboratory reviewer, and doctor/authorized viewer role surfaces.
- Organization-scoped subjects, test kits, tests, audit events, and review actions.
- Guided five-step new test flow with device camera permission, gallery upload, kit expiry checks, consent visibility, deterministic demo image-quality assessment, panel results, notes, and preliminary-result confirmation.
- Test history search and filters.
- Test detail evidence record with panel results, image hash, sync state, reviewer actions, and audit timeline.
- Offline draft indicator and local secure session storage.
- Express TypeScript API with protected routes, bcrypt password hashing for demo accounts, role middleware, organization isolation, rate-limited sign-in, Helmet, and a repository-shaped in-memory store.

## Demo access

The mobile app is explicitly labeled **Demo environment** and uses fake records. Select a role on the sign-in screen. The API demo users use:

- `admin@demo.druglense`
- `operator@demo.druglense`
- `reviewer@demo.druglense`
- `doctor@demo.druglense`

Demo password: `demo-password`

Do not use these credentials or the in-memory store for real patient data.

## Run locally

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/safetest run dev
```

Run `pnpm run typecheck` for the full TypeScript check. The mobile workflow is the supported Expo preview path; use Preview on your phone to open the project with Expo Go.

## Environment

See `.env.example`. The server requires `PORT` from the managed workflow and should use `SESSION_SECRET` in any non-demo environment. The mobile app receives `EXPO_PUBLIC_DOMAIN` from the managed workflow and does not hardcode an API host.

## Architecture

See:

- `docs/architecture.md`
- `docs/database-schema.md`
- `docs/api.md`
- `.env.example`

## Known limitations before healthcare use

- The current repository is an in-memory development repository; MongoDB Atlas, private object storage, signed evidence URLs, refresh-token persistence, and production identity-provider setup are not yet wired.
- Demo image-quality assessment is deterministic and not medical-grade AI.
- The current camera capture UI uses Expo Camera permission and preview; a device build should wire the camera ref to the native capture method and add device-level image hashing before production rollout.
- Notifications, QR token resolution, location capture, and report export are represented by role-aware UI states and must be connected to audited production services.
- A clinical, legal, privacy, and security review is required before processing real records.

## Security checklist

- [x] Do not put patient names, results, or medical data in QR content.
- [x] Role and organization checks exist on API routes.
- [x] Passwords are hashed with bcrypt in the demo repository.
- [x] Request validation uses Zod.
- [x] Sign-in rate limiting and Helmet are enabled.
- [x] Audit events are created for authentication, subject creation, test creation, submissions, and reviews.
- [ ] Replace in-memory sessions with a managed production auth provider and persistent refresh-token rotation.
- [ ] Add private object storage and signed URLs for evidence files.
- [ ] Add dependency, SAST, privacy, threat-model, and penetration reviews.