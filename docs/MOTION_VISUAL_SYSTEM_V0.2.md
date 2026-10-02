# IFP MOTION + VISUAL SYSTEM — V0.2

## North star

**Editorial authority × real fundraising proof × restrained technology.**

The site should feel like a serious expert institution with a contemporary product layer — not a generic NGO template and not an AI-dashboard landing page.

## Visual language

### Base

- warm paper background
- near-black ink
- deep institutional green
- signal red drawn from Martyna's current portrait styling
- electric lime reserved for AI / progress / activation
- large editorial serif for authority and narrative
- neutral sans-serif for navigation, metadata and controls

### Hierarchy

1. person / statement
2. proof / outcomes
3. programs / method
4. work / case studies
5. AI execution layer
6. knowledge / conversion

Avoid card grids as the default. Use whitespace, typographic scale, editorial rows, full-bleed sections, sticky narrative, image-led case studies, and border rhythm.

## Motion principles

### 1. Motion must explain state

Motion is allowed when it reveals hierarchy, carries the user between stages, visualises progress, connects AI skills, exposes a case study, or demonstrates a program journey.

No decorative bounce loops.

### 2. Hero choreography

Load:
- kicker fades / rises,
- headline reveals line by line,
- Martyna portrait enters with soft clip reveal and scale settle,
- orbit geometry drifts at low amplitude,
- CTA appears after title,
- metrics enter with a short stagger.

Scroll:
- portrait receives low-amplitude parallax,
- hero background watermark remains visually static,
- proof rail remains stable.

### 3. Proof section

Outcomes are editorial rows. Hover shifts the background subtly and moves the arrow diagonally. No floating card shadow.

### 4. Case-study section

Desktop: section intro may remain sticky while campaign visuals scroll independently. Image scale settles slightly on hover / reveal.

Mobile: no sticky trap; linear storytelling with full-width visuals.

### 5. Program section

Program container is a stage, not a card.

Motion order: metadata → program title → timeline cells → CTA.

Future V0.3: connect timeline scroll position to lesson progress and optionally scrub a thin progress line.

### 6. AI Lab graph

The graph is the strongest technology-specific motion moment.

Scroll:
- route line draws progressively,
- each node activates only when the route reaches it,
- node state changes from muted to live,
- final node is Human Review.

Rule: **AI ends at human review.**

Mobile: replace SVG path choreography with sequential stacked nodes.

### 7. Logo rail

Slow continuous marquee; grayscale; low contrast; pauses on hover; disabled when reduced motion is active.

## Motion tokens

- fast: 180–250ms
- standard: 420–550ms
- reveal: 700–900ms
- hero settle: 1100–1300ms
- easing default: cubic-bezier(.16,1,.3,1)
- parallax max amplitude: 12–32px effective
- stagger: 60–120ms

## Accessibility

'prefers-reduced-motion: reduce' must disable marquee, disable parallax, remove clip/transform entrance animation, reveal all content immediately, and render the AI route as complete.

No information may exist only inside an animation.

## Hero asset strategy

Primary: Martyna 2026 transparent full-body portrait.

Secondary: close-up 2026 portrait for authority section.

Production: migrate assets into project-owned storage, generate WebP / AVIF derivatives, keep original approved image, and do not permanently hotlink the legacy WordPress installation.

## Content photography

Prefer: real Martyna photography → real campaign visuals → real client portraits → real client logos → custom abstract graphic elements.

Avoid generic NGO stock photography unless a specific content gap requires it.

## Components / states

### Buttons

- dark primary
- lime AI primary
- editorial text link

States: rest, hover lift max 2px, focus-visible, disabled.

### AI node

- dormant
- active
- completed (future)
- review

### Program timeline

- upcoming
- active
- complete (future interactive state)

## Mobile parity

Mobile is not a compressed desktop version.

Hero: text first, portrait below with overlap, 2×2 proof rail.

AI: sequential nodes instead of spline.

Case studies: linear full-width gallery.

Programs: 2-column timeline cells.

## Figma deliverable

Figma file: **IFP — Motion + Visual System V0.2**

Maintain frames/pages for Visual System, Homepage Desktop, Homepage Mobile, AI Lab, and Motion Board.

## Prototype status

V0.2 uses public legacy image URLs for showcase speed.

Before production:
- replace hotlinks with owned assets,
- confirm metric values with Martyna,
- complete full page-by-page content migration,
- verify Lighthouse, accessibility and structured data,
- run desktop + mobile browser QA.