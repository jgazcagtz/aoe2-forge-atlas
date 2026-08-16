# Forge Atlas

Forge Atlas is an independent Age of Empires II strategy encyclopedia and AI field guide. It combines the structured Siege Engineers tech-tree dataset with a responsive discovery experience, comparisons, favorites, public-domain historical imagery, and grounded DeepSeek strategy briefs.

## Product experience

- Responsive discovery homepage and original Forge Atlas brand system
- Searchable civilizations, units, buildings, and technologies
- Favorites stored on the current device
- Two-record comparison tray
- Context-aware detail briefs
- Forge AI strategy room with six free daily briefs
- Forge+ and founder-plan product positioning
- Public-domain media credits and independent fan-project disclosure

## DeepSeek setup

The API key is only read by the server function at api/ask.js. Never place it in app.js, index.html, a public environment variable, or source control.

Add DEEPSEEK_API_KEY as a sensitive Vercel environment variable for Production and Preview. DEEPSEEK_MODEL is optional and defaults to deepseek-v4-flash. The supported current values are deepseek-v4-flash and deepseek-v4-pro.

After adding or changing the variable, create a new deployment because existing deployments do not receive newly added environment variables.

## Monetizable features

The factual atlas remains free. Forge+ is designed around ongoing value:

- Unlimited AI matchup and strategy briefs
- Personalized build-order coaching
- Cloud-synced playbooks and favorites
- Matchup lab with saved comparisons
- Patch-change alerts
- Weekly practice drills and progress history
- Founder access, product voting, and locked annual pricing

Authentication, durable cloud storage, analytics, and checkout are the next commercial infrastructure milestones.

## Sources and licensing

Game data is sourced from the Siege Engineers aoe2techtree project. Historical imagery is downloaded into assets/media and documented in assets/media/credits.json. The interface uses original Forge Atlas branding and includes no extracted game sprites or official franchise logos.

This is an independent fan-made resource and is not affiliated with Microsoft or the Age of Empires franchise.
