# SafeTest API

The OpenAPI source of truth is `lib/api-spec/openapi.yaml`. Regenerate the shared client and Zod output after changing it:

```bash
pnpm --filter @workspace/api-spec run codegen
```

Current route groups:

- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/refresh`
- `GET|POST /api/subjects`
- `GET /api/test-kits`
- `GET|POST /api/tests`
- `GET /api/tests/:id`
- `POST /api/tests/:id/submit`
- `POST /api/tests/:id/review`
- `GET /api/dashboard`
- `GET /api/audit-logs`

All protected routes accept a bearer token. Production deployment should replace the demo session store with Clerk or another approved managed identity provider, persistent rotation, and organization membership checks.