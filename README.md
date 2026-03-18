# Polymarket Edge Studio

This project is now a pure Vue + TypeScript frontend.

It scans live Polymarket CLOB data in the browser, groups negative-risk markets into bundles, estimates whether a `buy-all-YES` bundle is profitable at current live asks, and lets you open and close paper positions using real market data.

No Python runtime is required.

## What it does

- fetches live markets from `https://clob.polymarket.com/sampling-markets`
- fetches live order books from `https://clob.polymarket.com/books`
- groups markets by `neg_risk_market_id`
- simulates buying every `YES` leg using actual order book depth
- filters bundles by profit, spread, holding window, and minimum size
- provides a visual dashboard for scan results
- provides a paper trading desk:
  - paper open at live asks
  - paper close at live bids
  - local portfolio persistence with `localStorage`

This is still not a guaranteed-profit system. The app only surfaces temporary pricing gaps that pass the current rules.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open `http://localhost:5173`.

## Build

```bash
npm run build
```

## Config

Optional Vite env values:

- `VITE_DEFAULT_SCAN_PAGES`
- `VITE_DEFAULT_BUNDLE_SIZE`
- `VITE_DEFAULT_BANKROLL`

See [`.env.example`](/e:/ai-work/project/.env.example).

## Notes

- The app uses public CLOB endpoints directly from the browser.
- It intentionally does not submit real orders.
- "Simulated betting on real data" here means paper execution with live order books, not real-money trading.
