# IFP Website + AI Lab V0.1

Prototype/showcase for **Instytut Fundraisingu w Polsce**.

## Goal

Refresh the existing information architecture without touching the current production WordPress site, and demonstrate how an **IFP AI Fundraising Lab** can become a native part of the institution's website.

## V0.1 scope

- refreshed editorial-first website design
- existing public information architecture preserved
- desktop + mobile responsive UI
- AI Lab with:
  - IFP Orchestrator
  - Donor Persona
  - Campaign Architect
  - Fundraising Copywriter
  - Landing Architect
  - Campaign Reviewer
  - downloadable Campaign Pack
- local shared state between skills
- OsaTechGPT attribution slot
- SEO/performance foundation
- static, dependency-free prototype
- **no production deployment and no changes to the existing Instytut site**

## Run locally

```bash
python -m http.server 4173
```

Open: http://localhost:4173

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Status

**V0.1 prototype** — AI outputs are deterministic demo outputs. Anthropic integration belongs to F0-01 / the production integration layer and intentionally is not enabled in this showcase.


## V0.2 — Motion + Visual System

Implemented:
- editorial homepage redesign with real IFP public imagery,
- Martyna-led hero,
- proof/outcome storytelling,
- campaign visual gallery,
- program journeys,
- scroll-driven AI Lab graph,
- responsive desktop/mobile motion,
- reduced-motion accessibility,
- Figma visual system + animated motion boards.

Figma: https://www.figma.com/design/VvdMTMt2av5EO52Nm6DacX

See:
- `docs/RESEARCH_V0.2.md`
- `docs/ASSET_INVENTORY_V0.2.md`
- `docs/CONTENT_MAP_V0.2.md`
- `docs/MOTION_VISUAL_SYSTEM_V0.2.md`

> Prototype-only note: V0.2 temporarily references approved-looking public assets from the existing IFP WordPress site. Production must migrate owner-approved media into the new asset pipeline instead of hotlinking legacy URLs.
