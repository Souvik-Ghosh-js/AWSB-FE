# Attar World Sonar Bangla — Storefront

The public shop, built with Next.js (App Router), React 19 and Tailwind CSS 4.

- API: https://github.com/Souvik-Ghosh-js/AWSB
- Admin panel: https://github.com/Souvik-Ghosh-js/AWSB-admin

## Getting started

```bash
npm ci
cp .env.example .env.local   # then fill in the blanks
npm run dev
```

Runs on http://localhost:3000 and expects the API at http://localhost:4000/api/v1.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Lint |
| `npm run typecheck` | `tsc --noEmit` |

## Configuration

Copy `.env.example` to `.env.local`.

Every variable here is `NEXT_PUBLIC_` and is therefore **shipped to the
browser**. No secret belongs in this file — the storefront never holds a
database credential, `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET`.
Only the publishable `NEXT_PUBLIC_RAZORPAY_KEY_ID` is used here, which is
what Razorpay Checkout is opened with and is safe in the browser by design.

`NEXT_PUBLIC_USE_MOCKS=true` renders the shop from `src/lib/mock-data.ts`
so pages can be designed before the API is running. It is read at build
time — never set it in production, or you will serve fake products.
