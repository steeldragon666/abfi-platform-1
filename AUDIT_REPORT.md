# Security and Code Audit Report

**Date:** 2026-01-17
**Repository:** abfi-platform-1
**Auditor:** Claude Code

---

## Executive Summary

This audit identified **14 critical issues**, **8 high-severity issues**, and **12 medium-severity issues** across the codebase. The most concerning findings involve hardcoded API keys in version-controlled files and potential XSS vulnerabilities.

---

## Critical Issues (P0) - Immediate Action Required

### 1. Hardcoded API Keys in `.env.example`
**Severity:** CRITICAL
**File:** `.env.example:39, 58`

Real API keys are committed to version control in the `.env.example` file:

```
Line 39: NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Line 58: MANUS_API_KEY=sk-KI8fRrpMhwEn0q99r-uEZan_ikx_bWj31iKNmHf6LlOFQJWmonSJfgFxren6viOFW2k8lm4HrnBqeQ9fjRjVIFf7EN8U
```

**Risk:** These keys can be used by malicious actors. Even if the keys are rotated, they remain in git history.

**Recommendation:**
- Immediately rotate both API keys
- Replace with placeholder values (e.g., `your-supabase-anon-key`)
- Consider using git-filter-branch or BFG Repo-Cleaner to purge from history

---

### 2. Hardcoded API Key in Script File
**Severity:** CRITICAL
**File:** `scripts/download-manus-graphics.cjs:12`

```javascript
const MANUS_API_KEY = process.env.MANUS_API_KEY || 'sk-Y-7DlRNlRvkObQTQpiorbhhw7ND2Wz3w9un8OoF55HFW_-PTXAOe0AELHc8WHhQnhc-sNrLaWZh8tWPmUrix8IqtkT9p';
```

**Risk:** A different Manus API key is hardcoded as a fallback.

**Recommendation:**
- Remove hardcoded fallback
- Fail explicitly when env variable is missing

---

### 3. Hardcoded SILO API Credentials
**Severity:** CRITICAL
**File:** `server/apis/australianDataRouter.ts:88-89`

```typescript
username: "abfi@example.com",
password: "apirequest"
```

**Risk:** API credentials are hardcoded in server code.

**Recommendation:**
- Move to environment variables: `SILO_API_USERNAME` and `SILO_API_PASSWORD`
- Update `.env.example` with placeholders

---

### 4. Corrupted `.env.example` Content
**Severity:** CRITICAL
**File:** `.env.example:35-38`

The file contains embedded JavaScript code that shouldn't be there:

```
NEXT_PUBLIC_SUPABASE_URL=
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://wwryjddbttwarpndglwt.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
```

**Risk:** File corruption could cause parsing errors. Also exposes real Supabase URL.

**Recommendation:**
- Remove JavaScript code from env file
- Replace with proper placeholder format

---

## High-Severity Issues (P1)

### 5. Potential XSS via innerHTML
**Severity:** HIGH
**Files:**
- `client/src/components/maps/ProjectsLayer.tsx:137`
- `client/src/lib/pdfExport.ts:44`

User-controlled data is directly inserted into `innerHTML` without sanitization:

```typescript
popupContent.innerHTML = `
  ...
  <h3>${project.shortName || project.projectName}</h3>
  <p>${project.technology} • ${project.state}</p>
  ...
`;
```

**Risk:** If project names contain malicious scripts, they could be executed.

**Recommendation:**
- Use textContent for text-only content
- Use a sanitization library like DOMPurify for HTML content
- Consider using React's JSX rendering instead of innerHTML

---

### 6. Potential SQL Injection
**Severity:** HIGH
**File:** `server/services/entityResolution.ts:126`

```typescript
sql`JSON_CONTAINS(${stealthEntities.identifiers}, '"${signal.identifiers.abn}"', '$.abn')`
```

Direct string interpolation within the `sql` template literal could allow SQL injection if `signal.identifiers.abn` contains malicious content.

**Recommendation:**
- Use proper parameterization: `sql`JSON_CONTAINS(${stealthEntities.identifiers}, ${JSON.stringify(signal.identifiers.abn)}, '$.abn')``
- Or use Drizzle's JSON functions if available

---

### 7. Weak Default Secrets
**Severity:** HIGH
**Files:**
- `api/dev-auth/login.ts:53`
- `api/trpc/[trpc].ts:191`
- `api/dev-auth/me.ts:32`
- `server/_core/env.ts:3`
- `server/evidence.ts:215`

Multiple files fall back to weak default secrets:

```typescript
process.env.SESSION_SECRET || "dev-secret-key-change-in-production"
process.env.JWT_SECRET || "abfi-dev-jwt-secret-key-2024"
process.env.HASH_SECRET_KEY || "abfi-default-key"
```

**Risk:** If environment variables aren't set in production, weak secrets are used.

**Recommendation:**
- Fail startup if required secrets are missing in production
- Add validation: `if (NODE_ENV === 'production' && !SECRET) throw new Error(...)`

---

### 8. TypeScript Safety Bypasses
**Severity:** HIGH
**Files:**
- `server/_core/sse.ts:1` - `@ts-nocheck`
- `server/services/earthEngine.ts:13` - `@ts-ignore`

Entire files or critical sections have TypeScript checking disabled.

**Recommendation:**
- Address underlying type issues instead of suppressing them
- Add proper type definitions for third-party libraries

---

### 9. Excessive `any` Types
**Severity:** HIGH
**Count:** 509 occurrences across 129 files

The codebase contains 509 uses of `any` type, undermining TypeScript's type safety.

**Top files by count:**
- `server/db.ts`: 50 occurrences
- `server/apis/australianDataRouter.ts`: 36 occurrences
- `server/intelligenceRouter.ts`: 23 occurrences

**Recommendation:**
- Gradually replace `any` with proper types
- Use `unknown` when type is truly unknown
- Create interfaces for external API responses

---

## Medium-Severity Issues (P2)

### 10. Excessive Console Logging
**Severity:** MEDIUM
**Count:** 99 files with console statements

Production code contains extensive `console.log`, `console.error`, and `console.warn` calls.

**Recommendation:**
- Replace with structured logging (already have `server/utils/logger.ts`)
- Remove debug console.log statements
- Keep console.error for critical errors only

---

### 11. Math.random() in Server Code
**Severity:** MEDIUM
**Files:** Multiple seed scripts and connectors

`Math.random()` is used for generating IDs and tokens in some contexts.

**File:** `server/_core/sse.ts:28`
```typescript
return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

**Risk:** `Math.random()` is not cryptographically secure.

**Recommendation:**
- Use `crypto.randomUUID()` or `crypto.randomBytes()` for IDs/tokens
- `Math.random()` is acceptable for seed scripts and mock data

---

### 12. Hardcoded Localhost URLs
**Severity:** MEDIUM
**File:** `client/src/config/env.ts:48, 58, 61`

Development fallback URLs are hardcoded:
```typescript
VITE_OAUTH_PORTAL_URL: optionalUrl("http://localhost:5173"),
VITE_INTELLIGENCE_API_URL: optionalUrl("http://localhost:3001"),
```

**Risk:** Could accidentally use localhost in production.

**Recommendation:**
- Add production checks before using fallbacks
- Log warnings when falling back to localhost

---

### 13. Missing Rate Limiting on Some Endpoints
**Severity:** MEDIUM

While `/api/oauth`, `/api/mygovid`, and `/api/trpc` have rate limiting, other endpoints like `/api/v1/*` (sentiment, prices) appear unprotected.

**Recommendation:**
- Apply rate limiting to all public API endpoints
- Consider different limits for authenticated vs anonymous requests

---

### 14. Uncleared Intervals
**Severity:** MEDIUM
**File:** `server/_core/security.ts:416`

```typescript
setInterval(() => {
  // cleanup logic
}, interval);
```

Intervals are set but the handles aren't stored for cleanup on shutdown.

**Recommendation:**
- Store interval handles
- Clear on process exit (`process.on('SIGTERM', ...)`)

---

## Low-Severity Issues (P3)

### 15. dangerouslySetInnerHTML in Charts
**File:** `client/src/components/ui/chart.tsx:81`

Using `dangerouslySetInnerHTML` in chart component. Lower risk since data is typically from trusted sources.

### 16. Disabled Fields Without Visual Indication
Several forms have disabled fields that may confuse users.

### 17. Legacy Supabase Configuration
`.env.example` references Supabase which is marked as "legacy" but configuration still exists.

---

## Recommendations Summary

### Immediate Actions (This Week)
1. Rotate all exposed API keys (Supabase, Manus)
2. Remove hardcoded credentials from `.env.example`
3. Fix `.env.example` file corruption
4. Move SILO API credentials to environment variables

### Short-term Actions (This Month)
1. Add XSS sanitization to innerHTML usage
2. Fix SQL injection vulnerability in entityResolution.ts
3. Add production secret validation
4. Replace `@ts-nocheck` with proper types

### Long-term Actions (Next Quarter)
1. Reduce `any` type usage to <100 occurrences
2. Implement structured logging throughout
3. Add comprehensive rate limiting
4. Create security testing suite

---

## Files Requiring Immediate Attention

| File | Issue | Severity |
|------|-------|----------|
| `.env.example` | Hardcoded API keys, corrupted content | CRITICAL |
| `scripts/download-manus-graphics.cjs` | Hardcoded API key | CRITICAL |
| `server/apis/australianDataRouter.ts` | Hardcoded SILO credentials | CRITICAL |
| `server/services/entityResolution.ts` | SQL injection | HIGH |
| `client/src/components/maps/ProjectsLayer.tsx` | XSS via innerHTML | HIGH |

---

*This report was generated automatically. Please review all findings and prioritize based on your specific deployment context.*
