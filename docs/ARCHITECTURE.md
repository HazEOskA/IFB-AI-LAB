# IFP WEBSITE + AI LAB — ARCHITECTURE LOCK V0.1

## Target

Conceptual replacement website for Instytut Fundraisingu w Polsce with an embedded **IFP AI Fundraising Lab**.

## Scope boundary

This repository is a prototype/showcase only.

It does **not**:
- modify the current WordPress installation,
- migrate WooCommerce,
- deploy to the production domain,
- use real participant/customer data,
- call Anthropic in V0.1.

## Information architecture

The current public structure is preserved so a future production migration can keep existing URLs and search equity:

- /
- /o-instytucie/
- /oferta/
- /szkolenia/
- /blog/
- /bezplatna-wiedza/
- /sklep/
- /kontakt/
- /ai-lab/ — new capability layer

## Experience principles

1. **Fundraising first, AI second** — the product language starts from NGO outcomes, not model names.
2. **Expert authority stays human** — IFP methodology is the domain authority; AI executes bounded tasks.
3. **One journey, five skills** — outputs flow forward instead of becoming five disconnected chats.
4. **Low cognitive load** — a non-technical fundraiser can start by describing their organisation and objective.
5. **Evidence over magic** — assumptions are labelled; final outputs remain reviewable.
6. **Mobile parity** — no desktop-only critical path.
7. **SEO by construction** — semantic HTML, real headings, metadata, internal links, structured data, lightweight assets.

## AI Lab capability graph

```
USER / NGO
   |
   v
IFP ORCHESTRATOR
   |
   +--> DONOR PERSONA
   +--> CAMPAIGN ARCHITECT
   +--> FUNDRAISING COPYWRITER
   +--> LANDING ARCHITECT
   +--> CAMPAIGN REVIEWER
   |
   v
CAMPAIGN PACK
```

### Orchestrator

The orchestrator does not try to generate every deliverable itself. It:
- reads the current brief,
- detects the missing artefact,
- proposes the next skill,
- passes structured output to the next step,
- keeps the user inside one understandable workflow.

### Shared state

V0.1 keeps shared state in browser localStorage:
- organisation brief,
- campaign objective,
- persona,
- campaign plan,
- copy,
- landing outline,
- review,
- progress.

Production should replace this with authenticated server-side state.

## Skill contracts

### ifp-donor-persona
Input: organisation brief + goal.
Output: donor profile, motivations, objections, language, channels.

### ifp-campaign-architect
Input: brief + persona.
Output: campaign objective, offer, channel plan, KPI set, execution sequence.

### ifp-fundraising-copy
Input: persona + campaign.
Output: appeal message, email angle, social angle, CTA.

### ifp-landing-architect
Input: campaign + copy.
Output: section order, message hierarchy, CTA placement, objections/FAQ.

### ifp-campaign-reviewer
Input: all previous artefacts.
Output: readiness score, missing evidence, risks, next fixes.

## Attribution

Prototype contains a discreet implementation credit:

**AI concept & system architecture — OsaTechGPT / Bartosz Osiński**

Any production attribution remains subject to agreement with Instytut Fundraisingu.

## F0-01 boundary

The real “Pogłębiona Persona Darczyńcy” migration is a separate implementation slice:
- server-side Anthropic call,
- server-only prompt,
- access gate,
- response validation,
- basic rate limiting,
- download,
- parity tests against the current Claude artefact.

V0.1 reserves the interface and flow for F0-01 but does not pretend the real integration already exists.

## Production migration notes

Before production cutover:
- inventory current URLs and redirects,
- preserve canonical paths where possible,
- export WordPress/WooCommerce content,
- replace prototype metadata with production canonical URLs,
- validate structured data,
- run Lighthouse + accessibility checks,
- run mobile and dark-mode checks,
- add analytics/consent according to IFP policy,
- connect real AI endpoints only after secrets/access controls exist.
