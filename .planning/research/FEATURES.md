# Feature Research

**Domain:** Scroll-driven storytelling personal portfolio — 7-chapter horizontal journey (1995 → 2026)
**Researched:** 2026-05-12
**Confidence:** HIGH (table stakes/accessibility/i18n verified against WCAG, MDN, official Vue i18n docs); MEDIUM (differentiators verified against Awwwards/FWA analysis + showcase sites); LOW where noted

---

## Feature Landscape

### Table Stakes A — Any Personal Portfolio in 2026

Features every portfolio must have. Recruiters assume these exist; their absence signals incompetence or unfinished work.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Contact information accessible from any section | Recruiter's only goal may be "get contact info fast"; burying it costs applicants jobs | LOW | Fixed overlay or persistent footer works. Email + LinkedIn minimum. GitHub optional but expected for eng roles. |
| Project showcase with title, tech stack, outcome | Recruiters scan, not read. If projects can't be parsed in 5 seconds, they bounce | MEDIUM | Each chapter's era projects. Name + 2-line description + key tech tags. Live link or screenshot. |
| Bio / about section | "Who is this person?" must be answerable without hunting | LOW | Present in every chapter per PROJECT.md; renders per chapter's era style. |
| Viewport meta tag + responsive layout | Mobile browsing is ~55% of web traffic even for B2B recruiting | LOW | Portrait is intentionally blocked; landscape is required. The overlay IS the mobile portrait response. |
| OG meta tags (og:title, og:description, og:image) | LinkedIn preview cards, Slack unfurls, email pastes — if the recruiter shares your URL, it must look intentional | LOW | Static in `<head>`. One good OG image (1200×630) showing the retro aesthetic works as brand signal. |
| JSON-LD structured data (Person schema) | Google rich results; AI context via entity-based SEO; increasingly relevant as recruiters use AI-assisted sourcing | LOW | One `<script type="application/ld+json">` block. Fields: name, jobTitle, url, sameAs (LinkedIn/GitHub/etc). |
| Page title + meta description | Browser tab, search result snippet, bookmark label | LOW | Title: "Rafael Matovelle — Full Stack & QA". Description: 1-sentence pitch. |
| Favicon | Signals that a site is finished. Missing favicon = unfinished project | LOW | Pixel art variant of the avatar (16×16 and 32×32 at pixel-perfect). Uses the retro theme as a signal. |
| Working links (no 404s on project links) | Dead project links are worse than no links — implies carelessness | LOW | Gate all links before deploy; dead repos should point to screenshots/archive. |
| Copy that is edited, not auto-translated | Tone mismatch between ES/EN copies flags non-native fluency | MEDIUM | PROJECT.md requires parity. This is Rafael's superpower as bilingual native; do not undermine it. |

### Table Stakes B — Scroll-Driven / Chapter-Based Sites Specifically

Features users of experimental/experiential sites expect. Missing these causes disorientation and abandonment.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Scroll progress indicator | Horizontal scroll disorientation is real: users don't know how much content remains | LOW–MEDIUM | Chapter dots (7 dots for 7 chapters) preferred over a continuous bar for this concept. Active dot = current chapter. |
| Current chapter label / breadcrumb | "Where am I in the journey?" must be answerable at a glance | LOW | "Chapter 3 — Web 2.0 (2013)" as a persistent HUD element. Reinforces the time-travel narrative. |
| Keyboard navigation (arrow keys) | Keyboard users exist; recruiters on laptop keyboards are the primary audience | MEDIUM | Left/Right arrows advance chapters. The horizontal scroll container needs `tabindex="0"`. CSS `scroll-snap-type: x mandatory` handles the snap; JS intercepts arrow keys to trigger programmatic scroll. |
| Touch / swipe support | MacBook trackpad two-finger swipe + mobile landscape swipe are primary nav inputs | LOW | CSS `overflow-x: scroll` + scroll-snap handles this natively. No extra library needed for basic swipe. |
| "Return to start / intro" control | Users who land mid-journey (deep link) need a way home | LOW | Home icon or chapter-0 dot in the nav strip. |
| Landing at a specific chapter (deep link) | Shareable URL like `#chapter-3` lets Rafael send direct links to recruiters: "here's where my QA era starts" | MEDIUM | Hash-based chapter addressing. SPA anchor caveat: DOM must be ready before scrolling to hash. Implement: on mount, read `window.location.hash`, scroll to that chapter. |
| Skip-to-content link (visually hidden, keyboard visible) | WCAG 2.4.1 Bypass Blocks. Screen reader and keyboard users need to bypass the chapter navigation HUD | LOW | `<a href="#chapter-content" class="skip-link">Skip to content</a>`. Visually hidden until focused. Minimum viable a11y compliance. |
| Scroll cue on first visit | Users don't know the site is horizontally scrollable — visual affordance is mandatory | LOW | Animated arrow or "scroll to explore" text on chapter 3 (default landing). Can be a subtle pixel art arrow sprite. Disappears after first scroll. |
| Language toggle accessible from any chapter | Bilingual audience; they switch and keep browsing | LOW | Persistent in the HUD alongside chapter dots. State stored in `localStorage` + `vue-i18n` global locale. |
| Mobile portrait overlay | The concept requires landscape. Portrait is explicitly blocked per PROJECT.md | LOW | Full-screen overlay with "Rotate your device" message. Triggered by `window.matchMedia('(orientation: portrait)')`. Does not need to be a full alternative layout. |
| Graceful chapter transitions | Jarring snap without any feedback feels broken | MEDIUM | CSS scroll-snap provides the mechanical snap. A brief opacity/fade or parallax continuation on scroll reinforces that transitions are intentional, not glitches. |

### Table Stakes C — Minimum Technical Baseline

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Core Web Vitals passing (LCP < 2.5s, CLS < 0.1) | Google ranking signal; also affects recruiter perception on slow connections | MEDIUM | Main risk: large pixel art assets causing LCP. Use lazy-loading per chapter; preload only chapter 3 (default landing). |
| Asset optimization (WebP/PNG, no uncompressed files) | Page weight directly tied to perceived quality for international audience (some EU/CA recruiters on variable connections) | LOW | `optimize_sprite` tool already in the MCP stack. Pixel art must be served as PNG (WebP can introduce interpolation artifacts on pixel art). |
| Firebase Hosting headers (cache-control, gzip) | Hosting platform already decided. Static assets should have long cache TTL. | LOW | Firebase hosting.json config. Not blocking for local dev phase. |

---

### Differentiators — What Makes THIS Site Stand Out

Features specific to the storytelling concept. These are the competitive advantage over generic portfolios.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Chapter-locked visual style morphing | The site IS the bio. Recruiter understands Rafael's arc without reading a CV line. This is the core value per PROJECT.md. | HIGH | Each chapter carries its own CSS custom property set (color palette, font stack, border style). Chapter transition = CSS class swap on `<body>` or root element. |
| Aging pixel art avatar bust (7 portraits) | Emotional anchor. A face that ages from 10 to 40 alongside the technology is memorable and human. Differentiates from every "floating head" portfolio. | HIGH (asset generation) / LOW (implementation) | pixelforge generates 7 busts. Implementation is a simple `<img>` swap per chapter. The wow is in the asset quality, not the code. |
| Era-authentic visual language per chapter | Chapter 0 has green terminal text. Chapter 1 has `<marquee>` and Comic Sans. Chapter 2 has Flash-era gloss. Each one IS that era. | HIGH (design/CSS work) | Chapters 0–1 are CSS-only (no pixel art needed). Chapters 2–6 use pixelforge assets. The authenticity requires restraint: not "retro vibes" but accurate reconstruction. |
| Projects as part of the era, not a grid | Projects appear in the chapter where they happened, styled as that era's UI. Chapter 2 projects look like Flash portals. Chapter 5 projects look like modern dashboards. | HIGH | Requires per-chapter project card components with era-specific styling, not a shared generic card. |
| Phaser chapter 6 as explorable space scene | The final chapter is interactive. Planets are projects. Ships cross the screen. The visitor is in the present moment. | HIGH | Chapter 6 only. Phaser 3.86 ESM. Parallax layers, ambient ships, clickable planet-projects. This is the most technically demanding chapter and the most memorable. |
| "Always show a smile" — warm tonal throughline | The copy is not corporate. Each chapter has a bit of personality. The site ends with convergence, not a sales pitch. | LOW (copy work) / HIGH (curation) | Rafael's own voice. Cannot be templated. This is what makes a portfolio feel like a person, not a product. |
| Default landing at Chapter 3 (Web 2.0 polish) | First impression is polished, not confusing. Visitor sees a competent site before exploring the weird early chapters. | LOW (routing) | Scroll-snap `initial scroll position` or JS scroll on mount to chapter 3. The naive chapters (0–1) are rewards for curious visitors who scroll backward. |
| Scroll-backward reward (chapters 0–1) | Visitors who explore "before the beginning" find the pre-career origin story. Easter egg dynamic creates delight and shareability. | LOW | Only works because of the chapter-snap design. No extra implementation needed beyond having chapters 0–1 before the default. |

---

### Anti-Features — Deliberately NOT Building

| Feature | Why Requested | Why It's a Problem | Alternative |
|---------|---------------|-------------------|-------------|
| Auto-translated copies | "Shipping fast" — just run the EN copy through DeepL | Destroys the bilingual-native brand signal. Rafael's ES/EN fluency is a career asset. Auto-translated text reads as non-native to native speakers. | Write both copies from scratch. Rafael provides ES, Claude writes EN (or vice versa) and Rafael reviews. |
| Animated character walking between chapters | "It would be so cool if the avatar walked!" | pixelforge's documented limitation: frame-to-frame incoherence. Would require Aseprite or manual pixel art. Out of scope per PROJECT.md. | Static bust per chapter. The aging visual (different art per chapter) already carries the narrative motion without animation. |
| Continuous scroll morphing (interpolated CSS between chapters) | "Smoother than snap, more cinematic" | Requires real-time CSS interpolation between 7 distinct visual systems. Engineering complexity is disproportionate; subtle visual glitches between eras would undermine the effect. The sharp snap is a feature, not a bug — it's a "warp to the next era" feel. | Scroll-snap with a brief transition effect (opacity fade or pixel-dissolve) as chapter changes. |
| Dark/light mode toggle | Standard expectation for 2026 sites | Each chapter has its own intentional palette. A dark/light toggle would override the era-authentic colors and break chapters 0 (green terminal = always dark) and 1 (garish colors = always light). | The chapters ARE the modes. Chapter 0 is dark mode. Chapter 1 is blinding light. This is the joke. Document this intentionally. |
| Blog / long-form content | "Position yourself as a thought leader" | Format of the site is experiences, not reading. Long content would need a different layout context that breaks the immersion. Out of scope per PROJECT.md. | External link to Medium or dev.to if Rafael publishes. Chapter copy can reference "I wrote about this" with external link. |
| Loading screen / intro animation | "Epic entrance" | Every second before content is a second where a recruiter might bounce. An intro gate is a commitment the first-time visitor hasn't made. | Preload chapter 3 assets while the rest load. The first thing they see is a polished chapter, not a loading bar. Smooth progressive load. |
| Cookie consent banner | "Legal compliance" | Portfolio sites under GDPR/CCPA generally don't require consent banners if they use no tracking cookies or analytics that set cookies (Firebase Analytics can be configured cookieless). A cookie banner on a personal portfolio signals corporate-template thinking. | If analytics are needed, use Firebase Analytics in cookie-less mode, or simple server-side log counting. No banner needed. |
| Bento grid layout for projects | Trendy, popular, expected | CreativeBoom 2026 report: bento grids are "overdone" and signal template-reliance. A bento grid on a portfolio about authenticity and era-specificity would be incongruous. | Era-authentic project cards per chapter. Chapter 2 gets a Flash-era banner layout. Chapter 5 gets a Figma-adjacent card. |
| Glassmorphism / liquid glass panels | "Modern premium feel" | CreativeBoom 2026: glassmorphism is explicitly called out as one of the most exhausting design trends. Apple overexposed it. | Use solid-fill panels with strong color contrast appropriate to each era. Chapter 4 (AR/VR) can have translucent panels as a period-accurate reference, not a trend. |
| Parallax on text / typography | "Dynamic feel" | Text parallax creates cognitive friction: the text jumps around as the user tries to read it. Real cost in accessibility (vestibular triggers) and usability. WCAG 2.3.3. | Parallax on background assets only (the pixel art layers). Foreground text stays static. |
| "Hire me" CTA button in every section | "Convert the recruiter" | Feels desperate on an experiential portfolio. If the experience does its job, the contact info in the HUD is enough. Repeated CTAs undermine the artistic framing. | One persistent, low-key contact access point. Let the work sell. |
| Cursor replacement / custom cursors | "Brand consistency" | Custom cursors break accessibility for low-vision users using system cursor size settings. Also heavily associated with agency portfolio cliche of 2020–2022. | Chapter 6 (Phaser) can have a Phaser-native cursor effect within the canvas only — that's scoped and expected in a game context. |

---

## Feature Dependencies

```
Chapter Navigation HUD
    └──requires──> Chapter scroll-snap system
                       └──requires──> CSS scroll-snap-type + JS chapter tracking

Language Toggle
    └──requires──> vue-i18n installed + translation JSON files
    └──enhances──> Deep link (locale should survive hash navigation)

Deep Linking (#chapter-N)
    └──requires──> Chapter scroll-snap system
    └──requires──> On-mount hash reading logic

Keyboard Navigation (arrow keys)
    └──requires──> Chapter scroll-snap system
    └──requires──> tabindex="0" on scroll container
    └──conflicts──> Default browser arrow key scroll behavior (must preventDefault)

Skip-to-content link
    └──requires──> Identifiable #chapter-content anchor in DOM

Phaser Chapter 6
    └──requires──> All other chapters stable (chapter 6 is last, highest complexity)
    └──requires──> Pixel art assets (ships, planets, parallax layers) generated

Mobile Portrait Overlay
    └──requires──> CSS media query + JS matchMedia listener
    └──conflicts──> Chapter navigation (portrait overlay replaces it entirely)

Avatar Bust (per chapter)
    └──requires──> pixelforge 7-portrait generation pipeline
    └──requires──> Asset post-processing via Adobe MCP

prefers-reduced-motion compliance
    └──requires──> Chapter transition effects have CSS @media (prefers-reduced-motion) variants
    └──requires──> Phaser chapter 6 has a reduced-motion mode (static scene, no moving ships)
```

### Dependency Notes

- **Chapter scroll-snap requires stable before Phaser chapter 6:** Chapter 6's Phaser canvas lives inside the snap container. Building Phaser before scroll-snap is stable will require rework.
- **Keyboard navigation conflicts with default browser behavior:** `overflow-x: scroll` containers receive arrow key events, but the browser also scrolls the page. `preventDefault()` on arrow keys when the scroll container is focused is required. Test across Chrome/Firefox/Safari.
- **Language toggle must survive deep links:** If a recruiter shares `#chapter-5` with a colleague, the URL cannot carry locale state (it's SPA, no URL routing for locale). `localStorage` persistence is the correct approach.

---

## MVP Definition

### Launch With (v1)

Minimum viable to send to recruiters. Every item below is a hard blocker.

- [ ] Chapter scroll-snap system working (7 chapters, CSS scroll-snap, mouse wheel + trackpad) — validates the core concept
- [ ] Chapter progress dots + current chapter label — without this, users are disoriented
- [ ] Default landing at Chapter 3 on first load — first impression must be polished
- [ ] Era-authentic styles for all 7 chapters (even placeholder content) — the visual transformation IS the product
- [ ] Pixel art avatar bust — one per chapter; the aging face is the emotional core
- [ ] Bio content in all chapters — core content per PROJECT.md
- [ ] Projects per chapter — at least 1–2 per chapter, styled appropriately
- [ ] Contact info accessible from every chapter (persistent HUD) — recruiter's only goal
- [ ] Language toggle ES/EN functional — Rafael's audience is split; broken i18n blocks the bilingual brand signal
- [ ] Mobile portrait overlay — prevents a broken experience on portrait mobile
- [ ] OG meta tags + JSON-LD Person schema — every time the URL gets shared, it must look professional
- [ ] Skip-to-content link — minimum viable WCAG compliance
- [ ] Keyboard arrow key navigation — laptop keyboard is the primary recruiter device
- [ ] prefers-reduced-motion respected for transitions — required for WCAG 2.3.3

### Add After Validation (v1.x)

Add once the base experience is shipped and tested with real visitors.

- [ ] Deep linking (#chapter-N) — useful for sharing specific eras, but not blocking launch
- [ ] Phaser Chapter 6 (explorable space scene) — highest complexity, worthy of its own milestone
- [ ] Scroll cue animation polish (pixel-art arrow sprite) — functional plain text first is fine for v1
- [ ] Per-chapter project card era-styling — v1 can use simplified era-appropriate but not fully authentic styles; v1.x adds the full Flash-portal / Web2.0-card treatments

### Future Consideration (v2+)

- [ ] RSS / sitemap for project pages — only relevant if projects become individual pages with SEO value
- [ ] Analytics (cookieless Firebase) — validate visitor behavior patterns before optimizing
- [ ] Print stylesheet for "CV fallback" — low priority; recruiters who need a PDF get a separate PDF CV

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Chapter scroll-snap system | HIGH | MEDIUM | P1 |
| Era-authentic visual styles (7 chapters) | HIGH | HIGH | P1 |
| Avatar busts (pixelforge, 7 portraits) | HIGH | MEDIUM (asset gen) | P1 |
| Chapter navigation HUD (dots + label) | HIGH | LOW | P1 |
| Default landing at Chapter 3 | HIGH | LOW | P1 |
| Bio + Projects per chapter | HIGH | MEDIUM | P1 |
| Persistent contact / HUD | HIGH | LOW | P1 |
| Language toggle ES/EN | HIGH | LOW | P1 |
| OG meta tags + JSON-LD | MEDIUM | LOW | P1 |
| Mobile portrait overlay | MEDIUM | LOW | P1 |
| Skip-to-content + keyboard nav | MEDIUM | LOW | P1 |
| prefers-reduced-motion support | MEDIUM | LOW | P1 |
| Scroll cue on first visit | MEDIUM | LOW | P2 |
| Deep linking (#chapter-N) | MEDIUM | MEDIUM | P2 |
| Era-authentic project cards (fully styled) | MEDIUM | HIGH | P2 |
| Phaser Chapter 6 interactive scene | HIGH | HIGH | P2 |
| Favicon (pixel art avatar) | LOW | LOW | P2 |
| Firebase Hosting headers/caching | LOW | LOW | P2 |
| Core Web Vitals optimization | MEDIUM | MEDIUM | P2 |
| Analytics (cookieless) | LOW | LOW | P3 |

---

## Competitor / Reference Site Analysis

| Pattern | bruno-simon.com | Obys Agency | Cappen | This Site |
|---------|----------------|-------------|--------|-----------|
| Navigation metaphor | Drive a 3D car through world-sections | Scroll + WebGL transitions | Bold scroll + layer animation | Scroll left/right through 7 time eras |
| Progress indicator | Visual path/tiles in the world | Minimal or none | Not prominent | 7-dot chapter indicator + label |
| Chapter/section navigation | 5 zones in 3D world | Vertical sections | Vertical sections | 7 horizontal chapters |
| Mobile | Desktop-only (game controllers) | Responsive | Responsive | Landscape-only, portrait blocked |
| Accessibility | Minimal (game UX) | Moderate | Moderate | Minimal but intentional: skip link, keyboard nav, reduced-motion |
| Language | EN only | FR/EN | EN only | ES/EN toggle (parity) |
| Core technology | Three.js + Cannon.js (physics) | WebGL + GSAP | GSAP + custom | Vue 3 + CSS scroll-snap + Phaser (ch6 only) |
| Unique differentiator | You are the navigator; the portfolio is a game | Typography as primary motion actor | Parallax layer depth as brand identity | Time travel: the site morphs across 3 decades |

**Key insight from bruno-simon.com:** The site has almost no traditional accessibility. It is desktop-only, requires a mouse or controller, and has no skip links. It won awards because the concept and execution are exceptional. The lesson is that for a highly opinionated experiential portfolio, the quality of the concept grants license to deviate from convention — but only if the deviation is intentional and the quality is exceptional. Bruno Simon's site succeeds because everything is deliberate. Sloppy accessibility on a mediocre concept is negligence; intentional accessibility tradeoffs on an exceptional concept are a design decision.

---

## Accessibility — Realistic Minimum for This Opinionated UX

This site makes deliberate accessibility tradeoffs. The tradeoffs must be owned, not ignored.

### What We Commit To (Non-Negotiable)

| Feature | WCAG Criterion | Implementation |
|---------|---------------|----------------|
| Skip-to-content link | 2.4.1 Bypass Blocks | `<a href="#chapter-main">Skip to content</a>` in `<head>` of DOM, visually hidden until focused |
| Keyboard chapter navigation | 2.1.1 Keyboard | Left/Right arrow keys advance chapters; Tab reaches the HUD controls |
| Focus visible on HUD controls | 2.4.7 Focus Visible | Don't remove `outline` from toggle, chapter dots, or contact links |
| Color contrast (text layers) | 1.4.3 Contrast Minimum | Each chapter's text color must pass 4.5:1 against its background. Era-authentic colors may need adjustment. |
| prefers-reduced-motion respected | 2.3.3 Animation from Interactions | All chapter transitions and Phaser movement wrapped in `@media (prefers-reduced-motion: no-preference)`. Reduced motion: instant chapter swap, static Phaser background. |
| Alt text on avatar busts | 1.1.1 Non-text Content | `alt="Rafael Matovelle, age 26, in 2013"` (era-accurate, not decorative alt="") |
| Language declaration | 3.1.1 Language of Page | `<html lang="en">` or `<html lang="es">` updated when locale toggles |
| Portrait overlay message readable | 1.4.3 | The "rotate your device" text must pass contrast in that overlay |

### What We Deliberately Sacrifice (With Rationale)

| Tradeoff | WCAG Criterion | Rationale |
|----------|---------------|-----------|
| No screen-reader-friendly alternative layout | 1.3.1 Info and Relationships | The PROJECT.md explicitly rules this out as out-of-scope. The site is experiential; a linearized text fallback would be a different product. Honest documentation > silent failure. |
| Horizontal scroll itself | 1.4.10 Reflow | WCAG 1.4.10 generally exempts "content which requires two-dimensional layout for usage or meaning" — editorial and portfolio content qualifies. The key is the portrait overlay handles the viewport resize case. |
| Mobile portrait navigation | — | Blocked intentionally. The overlay explains why. Not a silent failure. |
| Phaser chapter 6 game-canvas content | 1.1.1, 4.1.2 | Canvas content is not natively accessible. Mitigation: ARIA description on the canvas element listing the projects visible in it as text. Full screen-reader playability is out of scope. |

### Honest Confidence Assessment on A11y

Achieving WCAG 2.2 AA on a horizontal scroll experiential portfolio is not realistic without a full linearized alternative — which is explicitly out of scope. The minimum above achieves partial compliance with the most impactful criteria. This is the correct trade-off for a creative portfolio targeting sighted recruiter users, but it should be documented as a known limitation rather than presented as "accessible."

---

## i18n Scope — ES/EN Beyond the Toggle

The project requires ES/EN parity (PROJECT.md constraint). Here is what "beyond the toggle" looks like and what is in/out of scope.

| i18n Feature | In Scope? | Rationale |
|-------------|----------|-----------|
| Toggle persisted via localStorage | YES | Standard vue-i18n pattern. `$i18n.locale` set on toggle, saved to `localStorage`, restored on load. |
| Both locales tested for layout breakage | YES | ES strings are typically 20–30% longer than EN equivalents. Chapter layouts with tight pixel-art alignment may break. Test with both. |
| URL routing per locale (`/es/`, `/en/`) | NO | SPA with hash routing. Adding locale-prefixed URL routing doubles complexity without benefit for a personal portfolio. Toggle is sufficient. |
| RTL support | NO | ES and EN are both LTR. Not applicable. |
| Date format localization | LOW PRIORITY | Chapter labels use years (1995, 2013, etc.), not formatted dates. No localized date rendering needed. |
| Number/currency formatting | NO | No prices or quantitative data to format. |
| Hreflang meta tags | MAYBE | Would help if the site is indexed by Google. Hreflang for a toggle-based SPA requires JavaScript injection: `<link rel="alternate" hreflang="es">` and `<link rel="alternate" hreflang="en">` added on locale change. Low effort, useful for SEO. Defer to v1.x. |
| OG meta tags per locale | LOW PRIORITY | OG tags are static in `<head>`. For a personal portfolio this is acceptable. If both locales need different preview text, requires JS injection on locale toggle. Defer. |

**Recommendation:** vue-i18n global locale toggle + localStorage persistence. No URL routing per locale. Both copies reviewed by Rafael for authenticity. Hreflang meta tag injection added in v1.x if SEO becomes a priority.

---

## Sources

- [Awwwards Storytelling Collection](https://www.awwwards.com/awwwards/collections/storytelling/) — scroll-driven site patterns
- [Muzli 100 Best Portfolio Websites of 2025](https://muz.li/blog/top-100-most-creative-and-unique-portfolio-websites-of-2025/) — Cappen, Obys, Immersive Garden analysis
- [Bruno Simon Portfolio Case Study — Awwwards](https://www.awwwards.com/brunos-portfolio-case-study.html) — reference for experiential portfolio with intentional accessibility tradeoffs
- [Creative Boom: 10 Trends Creatives Are Over in 2026](https://www.creativeboom.com/insight/10-trends-creatives-are-so-over-in-2026/) — bento grids, glassmorphism, motion for motion's sake
- [Horizontal Scrolling Ultimate Guide 2025](https://www.hirecorewebvitalsconsultant.com/blog/horizontal-scrolling-in-web-the-ultimate-guide-for-2025/) — progress indicators, keyboard nav patterns
- [CSS Scroll-Driven Animations — Frontend Masters](https://frontendmasters.com/blog/using-css-scroll-driven-animations-for-section-based-scroll-progress-indicators/) — section-based progress indicators, Safari caveats
- [CSS Tricks: prefers-reduced-motion](https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/) — implementation pattern
- [WCAG 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) — accessibility baseline for animated scroll sites
- [W3C: Consider accessibility with horizontal scrollable regions (2024)](https://cerovac.com/a11y/2024/02/consider-accessibility-when-using-horizontally-scrollable-regions-in-webpages-and-apps/) — honest assessment of horizontal scroll a11y gaps
- [CSS Tricks: Keyboard Users Can't Scroll Overflow Containers](https://css-tricks.com/why-keyboard-users-cant-scroll-your-overflow-containers/) — tabindex fix for keyboard scroll
- [ACT Rules: Scrollable Element Keyboard Accessible](https://www.w3.org/WAI/standards-guidelines/act/rules/0ssw9k/proposed/) — official criterion for scrollable region keyboard access
- [vue-i18n: Locale Changing](https://vue-i18n.intlify.dev/guide/essentials/scope) — toggle pattern without URL routing
- [DEV: Beyond keywords — technical SEO for developer portfolios](https://dev.to/rossellafer/beyond-keywords-technical-seo-wins-for-developer-portfolios-4ko8) — JSON-LD Person schema for portfolio SEO
- [Smashing Magazine: CSS Scroll-Driven Animations (Dec 2024)](https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/) — scroll timeline API, browser support status

---

*Feature research for: scroll-driven storytelling personal portfolio*
*Researched: 2026-05-12*
