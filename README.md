# AOE2 Forge Atlas

AOE2 Forge Atlas is a responsive web app for exploring **Age of Empires II**
civilizations, units, buildings, and technologies from community-open game data.
The focus is on fast browsing, a strong UI for strategy creators, and a structure
that is ready for future monetization flows (newsletter, premium tools, guides, ads).

## Features

- Single-page interactive explorer with tabs:
  - Overview
  - Civilizations
  - Units
  - Buildings
  - Technologies
  - Monetization section
- Search across all entities.
- Sort options for quick ranking and comparison.
- Dynamic cards with key stats and quick wiki links.
- Snapshot export in JSON.
- Responsive design and animated card flow for desktop and mobile.

## Tech

- Pure HTML/CSS/JavaScript (no framework required).
- Static JSON dataset shipped in-repo (`data/aoe2-data.json` and
  `data/aoe2-strings.json` from `SiegeEngineers/aoe2techtree`).
- External summary endpoint (Wikipedia) for context.

## Local run

1. Open the folder:
   ```bash
   cd aoe2-forge-atlas
   ```
2. Run any static server, for example:
   ```bash
   npx serve .
   ```
   or
   ```bash
   python -m http.server
   ```
3. Open the shown local URL in your browser.

## What to expect

This is a production-friendly static site for Vercel deployment as-is.
It can be extended later with authentication, premium API routes, and payment
gateways once your monetization model is ready.
