# Webhook Admin — Sitecore Marketplace Dashboard Widget

A dashboard widget for administering Experience Edge webhooks, built on the
[Sitecore Marketplace Starter](https://github.com/Sitecore/marketplace-starter).

---

## Architecture

```
src/
├── app/
│   └── dashboard-widget-extension/
│       └── page.tsx          ← Main entry point (Next.js App Router)
├── components/
│   └── webhooks/
│       ├── WebhookList.tsx   ← List + inline edit rows
│       ├── WebhookForm.tsx   ← Shared create / edit form
│       ├── ExecutionLog.tsx  ← lastRuns history panel
│       └── SettingsPanel.tsx ← Connection settings UI
├── hooks/
│   └── useMarketplaceClient.ts  ← SDK init + host.user resolution
├── lib/
│   ├── api.ts      ← Edge Admin API calls (list, create, update, delete)
│   └── session.ts  ← sessionStorage read/write/clear helpers
└── types/
    └── webhook.ts  ← Types matching the Edge Admin API objects exactly
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the Marketplace SDK

The SDK is initialized in `src/hooks/useMarketplaceClient.ts`.
It reads the `origin` query parameter injected by Sitecore when the widget
loads inside an extension point. No manual configuration needed.

### 3. Run locally

```bash
npm run dev
```

To test inside Sitecore, paste the snippet from the
[Marketplace Quickstart](https://guidovtricht.nl/blog/sitecore-marketplace-quickstart)
into your browser console to register the app as a local extension.

---

## Connection settings & security

Settings (API base URL, bearer token, tenant ID) are stored in
**`sessionStorage`** — not `localStorage`.

| Property | Why it matters |
|---|---|
| Cleared on tab close | Tokens don't persist beyond the session |
| Never sent to a server | Stays entirely in the browser |
| Still XSS-vulnerable while active | Avoid running untrusted third-party scripts |

The `createdBy` field on new webhooks is populated from `client.query("host.user")`
and **never stored** — it stays in React state only.

---

## Extension points

This widget is wired to the **Dashboard Widget** extension point.
To add other extension points, duplicate `app/dashboard-widget-extension/`
following the marketplace-starter conventions.

---

## Webhook object reference

See the [Sitecore documentation](https://doc.sitecore.com/sai/en/developers/sitecoreai/sitecore-experience-manager/webhook-objects.html)
for the full shape of `WebhookEdit`, `Webhook`, `EntityUpdate`, and `WebHookRequest`.
All types in `src/types/webhook.ts` mirror the API exactly.
