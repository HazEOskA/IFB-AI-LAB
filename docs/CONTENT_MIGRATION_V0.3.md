# IFP CONTENT MIGRATION — V0.3

## Scope lock

V0.3 migrates real public IFP content into the existing normal inner-page layouts.

- HOME remains the only premium motion / Figma-driven surface.
- Inner pages remain content-first and lightweight.
- No production WordPress changes.
- No checkout / WooCommerce implementation.
- No Anthropic integration changes.

## Migrated routes

- /o-instytucie/instytut/
- /o-instytucie/ludzie/
- /o-instytucie/klienci/
- /strategie-fundraisingowe/
- /wdrozenie-fundraisingu-program-12-miesieczny/
- /kampanie-fundraisingowe/
- /szkolenia/
- /kurs_kampania_swiateczna/
- /system-regularnych-darowizn-w-ngo/
- /sklep/
- /bezplatna-wiedza/
- /bezplatna-wiedza/bezplatne-ebooki/
- /blog/
- /kontakt/

## Public sources used

- https://instytutfundraisingu.pl/
- https://instytutfundraisingu.pl/o-instytucie/instytut/
- https://instytutfundraisingu.pl/o-instytucie/ludzie/
- https://instytutfundraisingu.pl/o-instytucie/klienci/
- https://instytutfundraisingu.pl/kurs_kampania_swiateczna/
- https://instytutfundraisingu.pl/system-regularnych-darowizn-w-ngo/
- https://instytutfundraisingu.pl/sklep/
- https://instytutfundraisingu.pl/blog/
- public product pages linked from the shop.

## Normalization decisions

### Martyna authority

The people page currently states:
- fundraising since 2003,
- Instytut since 2011,
- 23 years of experience,
- work with 100+ NGOs,
- EFFIE and Golden Arrow,
- Ogilvy & Mather and ENEL-MED background.

The current 2026 Christmas-program page gives a newer marketing set:
- 23+ years,
- 157+ NGOs,
- 63 campaigns,
- 200,000+ acquired donors.

Prototype HOME may use the newer 2026 metrics. Production still requires explicit owner confirmation before those numbers become canonical site-wide.

### Christmas campaign — current 2026 edition

Current public page:
- 9-week live implementation program,
- 5 Oct – 6 Dec 2026,
- 9 video modules,
- 9 group mentoring sessions,
- 9 Q&A sessions,
- 4 specialised fundraising AI agents:
  - Donor Persona Generator,
  - Campaign Calculator,
  - Fundraising Copywriter,
  - Landing Page Creator,
- current page lists Leader package as 5597 PLN + VAT.

Production rule:
date, availability and price should come from the current selling source / WooCommerce rather than duplicated static values.

### Regular Donations System

Migrated as a program architecture, not a claim that enrolment is currently open.

Core output:
- Strategia Fundraisingowa,
- donor journey,
- donor persona,
- Komunikat za Milion,
- Model Finansowy Stabilnych Darowizn,
- 12-month action plan.

### Shop

Six current catalogue items are represented.

Prices are intentionally not hardcoded because public listing and individual product pages currently expose inconsistent values for some products.

Production source of truth:
WooCommerce product data.

### Client proof

The public homepage currently provides specific client-reported outcomes including:
- mali bracia Ubogich: +800% first campaign YoY,
- Fundacja Rodzin Polskich: close to +1000% after first year and first PLN 1M,
- Hospicjum Proroka Eliasza: +400% to PLN 4M/year,
- Fundacja Dziedzictwo Przyrodnicze: +2000% business fundraising from PLN 20k to PLN 400k/year.

These are preserved as attributed case-study proof, not rewritten as general promises of future results.

## Asset strategy in prototype

Public WordPress images are referenced directly for showcase speed:
- Martyna portraits,
- testimonial portraits,
- campaign portfolio images,
- selected client logos.

Before production:
1. obtain owner approval for migration,
2. copy approved originals into project-owned storage,
3. generate AVIF/WebP derivatives,
4. replace legacy hotlinks,
5. preserve accurate alt text and credits where required.

## Open production gates

- owner-confirm headline metrics,
- confirm final program dates / prices,
- confirm current product catalogue and WooCommerce IDs,
- obtain full-resolution testimonial portraits,
- map every article to its actual route instead of blog-hub fallback links,
- complete image migration,
- run Lighthouse / accessibility / link checks.
