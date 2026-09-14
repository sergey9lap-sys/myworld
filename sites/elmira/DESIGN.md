---
name: Эльмира — методолог
description: Botanical portraits, graphite/plum surfaces and visible service offers.
colors:
  ink: "#101211"
  milk: "#f5f1ec"
  surface: "#292326"
  surface-raised: "#342b30"
  surface-hover: "#3b3036"
  rose: "#d7a7ad"
  muted: "#b8b6b2"
  body-muted: "#c2b6ba"
  cta: "#a9d9cf"
  cta-text: "#153c36"
typography:
  display:
    fontFamily: "Cormorant, Georgia, serif"
    fontSize: "clamp(42px,4.15vw,60px)"
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-.025em"
  headline:
    fontFamily: "Cormorant, Georgia, serif"
    fontSize: "clamp(38px,3.55vw,52px)"
    fontWeight: 500
  body:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "14px"
    lineHeight: 1.65
rounded:
  button: "18px"
  offer: "16px"
  preview: "12px"
  feedback: "8px"
  client: "10px"
  petal-large: "34px 14px 34px 14px"
  petal-mobile: "28px 12px 28px 12px"
  petal-mark: "14px 5px 14px 5px"
  chip: "999px"
  avatar: "50%"
spacing:
  section: "88px"
  section-tablet: "62px"
  section-mobile: "48px"
---

# Design system — revision 4

## Comment-led readability refinement

2026-09-10 mobile pass: on phones the opening promise and a compact art-directed portrait share the first row, so Elmira is visible in the first glance. The phone display size is reduced to 28–32px so «образовательный» remains complete beside the portrait rather than clipping or crossing it. Supporting copy, CTA and audience chips follow at full reading width. Primary actions are capped at the same 290px mobile measure, rendered as block-level flex controls and centered across hero, cases, offers and contact; narrow cards reduce that width only when their own content box requires it. Russian short prepositions are bound to the following word where line endings are sensitive, with `text-wrap: pretty` as the general mobile fallback.

Final composition correction: the mobile portrait now spans the headline and supporting-copy rows, uses the source image's natural aspect ratio with `object-fit: contain`, and therefore keeps both elbows and the full right edge visible. The portrait caption is removed on phones. A 44px top inset keeps the flowers away from the viewport edge, while the supporting copy sits 12px below the heading instead of waiting for a fixed-height photo row.

2026-09-07 final scoped changes: mobile hero CTA fills content width; two equal audience chips plus8px gap match that width. Other CTA widths unchanged, desktop unchanged. Source note now «Примеры материалов после сессии». Social preview1200×630 renders existing supplied portrait and local typography; OG/Twitter metadata prepared, absolute production image URL pending public domain.

Follow-up: photo containers now have explicit matching backdrops and isolated blending, so child lighten blending survives parent fade/transform compositing. No source-image edits. Removed duplicate150+ metric and obsolete animation targets. Deliverables have complete rose1px borders,12px corners. All primary CTAs use58px height,18px corners,14px text and identical widths at each tested viewport (256 at1440,238 at1280,280 at800,289 at390,219 at320). Phone hero audience group retains the same combined width as its button. Desktop offer widths remain container-derived.

Latest authority: readability.css, loaded last. Sections alternate graphite / plum / graphite / plum / near-black. Main supporting paragraphs are17px desktop and16px phone; offer explanations15px desktop and16px phone. Primary button14px, compact final contact label13px. Hero audience group exactly matches hero CTA width, including its8px internal gap. Each desktop/tablet offer spans five shared CSS subgrid rows so names, outcomes, descriptions, result dividers and price/action groups align without fixed text heights. Phone offers retain natural single-column flow. Prices use the ordinary Cyrillic Р per user request. Redundant Telegram handle under final CTA removed. Keep онлайн-проектов together and break before чем in the experience heading. At1280×720 sections remain within viewport height; phones grow naturally.

## Current revision overrides

Botanical continuity now extends beyond color without repeating cropped photographs. The supplied peonies remain in the portraits; material previews, offer cards and the contact image repeat one diagonal petal-corner rhythm. Small petal outlines on offers scale the idea down to component level, while the final contact chapter enlarges it into a quiet three-petal contour field. Teal remains reserved for actions, including the cases CTA, so dusty rose never competes with action meaning.

Revision3 is authoritative where it differs from the historical revision2 descriptions below. Order: hero → materials → clients/about Elmira → formats → contact. Hero CTA leads to materials, not prices. The formats headline promises course structure or recommendations. The clients heading explicitly introduces Elmira in first person.

Desktop section budget: fit1280×720 without clipped text or fixed-height overflow. Current default section heights approximately640/635/556/646/473px. This is a desktop composition constraint, not applied to phone content or enlarged text. Section padding40px on short laptops,52px otherwise; headings36–46px (formats40px on short laptops). Four concise offers in one row from1100px, two columns on tablets, one on phones. No disclosures. Name, outcome, short explanation, retained result, price/time and CTA remain visible. Shared desktop CTA width derives from the common container and four-column inner width; height54px and radius18px. Phone controls fill their own parent and remain58px tall.

Materials are an accessible interactive showcase: three explicit tabs (strategy map, action document, session-recording still), one preview with an enlarge action, explanatory caption. The still is explicitly not a video player. Enlarging opens a native dialog on the same page with visible Close, previous/next, counter, Escape, outside-click close, focus return and background-scroll lock. Tab arrow/Home/End keys supported. Interaction is independent of GSAP; without JavaScript the default preview retains its source-image link. Dialog has18px corners, dimmed backdrop and viewport-bounded scrollable content. The white in authentic documents is not a light section background.

`structure.css` is loaded after refinement.css and owns these overrides; `materials.js` owns the viewer. GSAP trigger creation now follows reordered DOM. Existing stage ordering/reduced-motion fallbacks remain.

This replaces the first iteration after explicit user feedback. Implementation authority: index.html, style.css, refinement.css (last-loaded overrides), app.js. Old unused header/disclosure CSS in the base file is not part of this system.

## Visual direction

Graphite botanical portrait sections alternate with muted plum services and clients. Milk is a text color, not a section background. White within actual supplied document screenshots remains real source content. Dusty rose emphasizes headings and source audience counts. Teal identifies actions. Photographs blend with the dark background and are retained from the first iteration.

## Typography and layout

Exactly two self-hosted families: Cormorant display and Manrope body/controls. Hero is capped at60px on desktop, 42px on phones, 37px at320px. Section headings use a shared display scale, typically37px on phones. Copy generally13–16px with consistent roles. The container caps at1240px with48px desktop margins, reducing to32px,20px and18px at1100/800/600px.

No header or top navigation. Hero begins with the promise; on desktop the portrait is adjacent to the copy, while on phones it occupies the right side of the promise row. Explanation, CTA and outlined audience chips then use the full row. Materials and clients use asymmetric columns; phone sections stack. Contact copy precedes its image on phones.

## Services

Four permanently visible article offers, two columns on desktop and one below600px. No details/summary or hidden accordion state. Each offer contains name, client situation, explanation, explicit deliverable, price/format and a CTA at the bottom. Equal row-height flex layout aligns actions. Surface corners16px, padding32px desktop and24px phone (20px on smallest). Hover/focus-within lightens the surface and border; it does not imply a hidden action.

## Controls and feedback

Primary buttons: 310×58px on wide desktop, radius18px, same typography and arrow system. On phones every primary action shares a centered 290px maximum measure and remains fluid inside narrower card content boxes. Cards have clearly visible actions. Teal hover brightens, rises2px and shifts arrow3px. Audience chips match the hero action measure and use soft bordered petal shapes, not links. Document previews lift4px. Client avatars enlarge slightly on hover; lists acknowledge hover through a quiet surface change. Decorative headings are not made falsely clickable.

Focus ring3px with6px offset. Skip link remains keyboard-accessible. No forms, dialogs, input collection or backend. All contact buttons are ordinary Telegram anchors.

## GSAP choreography

Local GSAP3.15.0 and ScrollTrigger, not a remote CDN. Hero sequence: heading0s, description0.24s, CTA0.46s, photo0.60s, audience0.74s. Typical duration0.7s, power3.out; portrait1s. Every subsequent section begins with its heading, then explanation at0.22s, then supporting materials/actions from0.42s. Four offers have individual viewport triggers so lower cards can animate on phones; within each card name, situation, explanation, result and action enter in that order. No pinning, scrub, looping, or scroll hijack.

Default HTML/CSS is visible. GSAP enhances only after both dependencies load. Each sequence plays once; fast leave completes it. Keyboard focus completes the containing sequence. Reduced-motion preference reverts GSAP and disables spatial transitions; smooth scrolling forced off. Refresh after font load and pageshow. This preserves usable content when scripts fail or motion is disabled.

## Content

### Material tabs — 2026-09-14

Switching fixed-size material previews must preserve page scroll. Do not call page-wide ScrollTrigger.refresh() from tab selection; arrow-key tab focus uses preventScroll. Verified touch selection of all three previews and keyboard selection at 440px without scroll movement.

### Mobile CTA rail — 2026-09-14

On phone layouts all primary CTAs share a centered width of `calc(100vw - 72px)` and a minimum height of 58px. Do not restore independent 290/310px caps in hero, cases, pricing or contact. Pricing containers must accommodate this same rail. Verified mobile widths: 360 → 288px, 390 → 318px, 440 → 368px. Desktop sizing stays unchanged.

### Voice revisions — 2026-09-08

Service offers now distinguish one focused consultation request, a course structure with practice, a product matrix with next steps, and an independent review before a two-hour audit discussion. Deliverables are concrete; audit does not promise a turnkey course rebuild. Shared offer rows and 58px CTA heights remain aligned. Short-laptop spacing is tightened without reducing font sizes.

The client section now links to cases.html in the same tab. Four source-grounded case summaries cover course revision, design, audit and strategy. Each separates the initial task, work and reported outcome; Telegram is an optional source, not the primary reading destination. Revenue claims are attributed, team implementation is distinguished from audit recommendations, and an unlaunched project is explicitly identified. Sources: method_almira posts 30, 32, 36, 38 and 39. cases.html and cases.css are included in the static build allowlist.

Headlines now identify course structure/product improvement, retained documents/action plan/recording, experience with150+ clients, and consultation recommendations. Keep factual audience figures as source context, not outcomes. Prices remain provisional source values per user, subject to confirmation before public launch.
