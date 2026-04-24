# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
```

There are no tests in this project.

## Architecture

This is a **Next.js 16 / React 19** app deployed as a **Sitecore Marketplace dashboard widget**. It manages Experience Edge webhooks via the Edge Admin API.

### Auth flow

The browser cannot call `auth.sitecorecloud.io` directly (CORS). Instead:

1. `SettingsPanel` POSTs `client_id` + `client_secret` to the Next.js API route `src/app/api/token/route.ts`.
2. That route forwards them server-side to `auth.sitecorecloud.io` and returns the JWT.
3. The JWT (and API base URL) are saved to `sessionStorage` via `src/lib/session.ts` under the keys `sc_wh_url` / `sc_wh_token`. Credentials are never stored.

### API calls

`src/lib/api.ts` reads `sessionStorage` on every call (via `loadConnectionSettings()`). All Edge Admin API calls are direct `fetch()` from the browser with a `Bearer` token — there is no server-side proxy for the webhook CRUD endpoints, only for the token exchange.

### State ownership

`src/app/page.tsx` owns all top-level state: the active tab, the full webhook list, loading/error state, filter/search state, and connection state. Child components receive data and callbacks as props — they do not fetch independently (except `ExecutionLog` which receives already-fetched webhook data and derives its rows client-side).

### Marketplace SDK

`src/hooks/useMarketplaceClient.ts` initializes `ClientSDK` as a module-level singleton (`sdkClient`), targeting `window.parent` because the widget runs inside an iframe. It resolves `host.user` to get the current Sitecore user for the `createdBy` field on new webhooks. SDK init failures are non-fatal — `currentUser` falls back to `"unknown"`.

### i18n

`src/lib/i18n.ts` exports a `Translations` interface and a translation map keyed by `Lang`. `src/context/LanguageContext.tsx` provides `useTranslation()` throughout the app. To add a language: add its code to the `Lang` union and `LANGUAGES` array, then add a full translation block implementing the `Translations` interface.

### Types

`src/types/webhook.ts` mirrors the Edge Admin API object shapes exactly. `WebhookEdit` is the create/update payload; `Webhook` extends it with server-assigned fields (`id`, `tenantId`, `created`, `lastRuns`). Do not add fields here that the API doesn't return.

### enable/disable pattern

There is no dedicated enable/disable API endpoint. `enableWebhook` and `disableWebhook` in `src/lib/api.ts` both call `updateWebhook` with the full existing webhook object plus `disabled: true/false`. Any change to that pattern must keep all other fields intact.
