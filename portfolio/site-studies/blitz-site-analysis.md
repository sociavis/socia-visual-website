# BLITZ Site Analysis — Training Material for Socia Visual Team
**Date:** 2026-03-26
**Sprint Lead:** Blitz
**Sites Studied:** GP Canada, Dropbox Dash x McLaren F1, MP Motorsport

---

## SITE 1: GP Canada (gpcanada.ca/en/)

### What It Is
Formula 1 Grand Prix du Canada official event website. WordPress-based (Fatfish theme), multilingual (EN/FR via WPML), with Barba.js page transitions.

### Typography
| Role | Font | Weights | Notes |
|------|------|---------|-------|
| Headings | **Roboto Slab** | 400 | Serif, loaded via Google Fonts |
| Body / UI | **Titillium Web** | 400, 600, 700 | Sans-serif, loaded via Google Fonts |

- `font-display: swap` on all fonts (prevents FOIT)
- Preset sizes from WordPress block editor: small `13px`, medium `20px`, large `36px`, x-large `42px`

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Black | `#000000` | Primary backgrounds |
| White | `#ffffff` | Text on dark, backgrounds |
| Vivid Red | `#cf2e2e` | F1 accent, urgency |
| Vivid Cyan Blue | `#0693e3` | Links, interactive |
| Vivid Purple | `#9b51e0` | Gradient endpoint |
| Luminous Vivid Orange | `#ff6900` | CTA emphasis |
| Luminous Vivid Amber | `#fcb900` | Warm accent |
| Pale Pink | `#f78da7` | Soft accent |
| Cyan Bluish Gray | `#abb8c3` | Subtle text |
| Light Green Cyan | `#7bdcb5` | Success states |
| Vivid Green Cyan | `#00d084` | Positive indicators |
| Pale Cyan Blue | `#8ed1fc` | Light accent |

**Gradient Presets:**
- `vivid-cyan-blue-to-vivid-purple`: `linear-gradient(135deg, rgb(6,147,227) 0%, rgb(155,81,224) 100%)`
- `luminous-vivid-orange-to-vivid-red`: `linear-gradient(135deg, rgb(255,105,0) 0%, rgb(207,46,46) 100%)`
- `cool-to-warm-spectrum`: multi-stop 135deg gradient

**Shadow Presets:**
- Natural: `6px 6px 9px rgba(0,0,0,0.2)`
- Deep: `12px 12px 50px rgba(0,0,0,0.4)`
- Sharp: `6px 6px 0px rgba(0,0,0,0.2)`

### Page Transitions (THE KEY FEATURE)
**Library:** Barba.js
- Integrated with WordPress via `ff_wp_tracking_barba_settings`
- Google Analytics pageview tracking is conditional on Barba presence
- Prefetch strategy: conservative eagerness for `/en/*` links
- Excludes: `wp-*.php`, uploads, nofollow links from prefetch
- Barba enables smooth full-page transitions without hard reloads — content swaps happen in-place with CSS animation overlays

**What SV Can Steal:** Barba.js is lightweight and works with any static or CMS site. It intercepts link clicks, fetches the new page via AJAX, and swaps content containers while playing CSS/JS transition animations. This is the #1 technique for making multi-page sites feel like SPAs.

### Layout System
- WordPress block editor with CSS Grid + Flexbox
- `.is-layout-flex` — flex containers, `gap: 0.5em`
- `.is-layout-grid` — grid containers, `gap: 0.5em`
- Column blocks: `gap: 2em`
- Aspect ratio presets: square, 4:3, 3:4, 3:2, 2:3, 16:9, 9:16

### Navigation Structure
Hierarchical dropdown system:
```
Tickets → CGV Experience, Grandstands (13 options), Suites (10+), Terraces (4)
Event → CGV Experience, Application, Getting Here, FAQs, Accessibility, Site Map, F1 Academy, Food Experience
About → The Circuit, Our Values, Sustainability
Packages
F1 Experiences
Media | Careers | Contacts | Partners
```
- Mobile: portrait mode recommended
- "Back" links in dropdowns for nested navigation
- Language toggle (En/Fr)
- "Waiting List" CTAs for sold-out items

### EVENT SECTION ANALYSIS (BOSS PRIORITY)

**Architecture:** The event section is NOT a single listing page — it's a hub-and-spoke model:
- **Hub:** `/en/event/` — navigational page linking to sub-experiences
- **Spokes:** Individual experience pages (`/en/event/cgv-experience/`, `/en/event/food-experience/`, etc.)

**Event Sub-Page Template Pattern:**
1. Sticky header/nav (consistent across all pages)
2. Hero area with event-specific title + hero image (1920x1080, served at 1000x563)
3. CTA bar ("Single-day tickets on sale now" with button)
4. Details/Inclusions section with bulleted lists
5. Programming section
6. Access features
7. Newsletter signup ("STAY INFORMED")
8. Social links
9. Partners section
10. Footer

**Food Experience Page — Zone-Based Organization:**
- Content organized by physical zones (Orange, Yellow, Red, Pink, Blue, Green)
- Vendor listings within each zone as stacked vertical lists (not cards)
- Each vendor: Name + brief description + optional [menu] link
- Collapsible zone sections with "Back" navigation

**Key Insight for SV:** The event section works because:
1. Each experience gets its own dedicated page (not crammed into one)
2. Consistent template across all event pages (hero → details → CTA → footer)
3. Zone/category organization for complex content (food by location, tickets by type)
4. Breadcrumb navigation maintains wayfinding: `Event / CGV Experience`

**Template Pattern for Future Event Sites:**
```
[HERO: Full-width image + Event Title]
[CTA BAR: Primary action]
[DETAILS SECTION: What's included, bulleted]
[PROGRAMMING: Schedule or activities]
[ACCESS/LOGISTICS: How to get there, what to bring]
[NEWSLETTER: Email capture]
[PARTNERS: Sponsor logos]
[FOOTER]
```

### Tech Stack
- WordPress + WPML (multilingual)
- Fatfish theme framework
- Barba.js (page transitions)
- Google Analytics (`UA-27530326-1`)
- Google Tag Manager (`GTM-MVTMVX85`)
- Meta Pixel (IDs: `172835650195730`, `1575581310148034`)
- Google reCAPTCHA v3
- Cookie consent with granular tracking preferences

### What Makes It Special
1. **Barba.js page transitions** — the site feels like a native app, not a WordPress site
2. **Hub-and-spoke event architecture** — complex event info broken into digestible dedicated pages
3. **Consistent template system** — every sub-page follows the same structure but adapts content

### What SV Can Steal
- **Barba.js implementation** for any multi-page client site
- **Event page template pattern** (hero → CTA → details → logistics → newsletter)
- **Zone-based content organization** for complex events
- **Gradient preset system** for maintaining color consistency
- **Shadow preset system** (natural/deep/sharp) as a design token pattern

---

## SITE 2: Dropbox Dash x McLaren F1 (dash.dropbox.com/mclarenf1)

### What It Is
A marketing/partnership page for Dropbox Dash featuring McLaren F1 branding. Single-page scroll experience with heavy custom animations. NO external animation libraries — everything is vanilla JS + CSS + WebGL.

### Typography
| Property | Value |
|----------|-------|
| Smoothing | `-webkit-font-smoothing: antialiased` |
| Hero paragraph | `18px` at 1440px+, weight `500` |
| Search text | `16px` at 1440px+ |
| Stat numbers | `80px` at 1440px+, `96px` at 1920px+ |
| H2 wrapping | `text-wrap: pretty` (mobile), `text-wrap: balance` (992px+) |
| Paragraph max-width | `720px` at 1600px+ |
| Max body width | `1920px` |

### Color Palette
| Name | Value | Usage |
|------|-------|-------|
| Dropbox Blue | `rgb(0, 97, 254)` / `--mclaren-f1--dbx-blue` | Primary brand, links, glows |
| McLaren Papaya | `rgb(255, 128, 0)` / `--mclaren-f1--papaya` | Accent, speed redline |
| Graphite | `rgb(30, 25, 25)` / `--mclaren-f1--graphite` | Dark backgrounds |
| White | `rgb(255, 255, 255)` | Text, UI elements |
| Gray 300/600 | CSS variables | Secondary text, borders |

### Responsive Breakpoints
| Breakpoint | Purpose |
|------------|---------|
| `480px` | Small mobile transitions |
| `768px` | Tablet — body margin: `max(32px, safe-area-inset)` |
| `992px` | Desktop threshold — major layout changes |
| `1080px` | Body margin: `max(48px, safe-area-inset)` |
| `1440px` | Typography + grid refinements |
| `1600px` | Advanced layout grids |
| `1920px` | Maximum width optimizations |

**Body margin pattern (brilliant):**
```css
/* Mobile */ margin: max(20px, env(safe-area-inset-left));
/* 768px */ margin: max(32px, env(safe-area-inset-left));
/* 1080px */ margin: max(48px, env(safe-area-inset-left));
```

### Animations — THE CORE OF THIS SITE

#### CSS Keyframes
```css
@keyframes mf1-bounce-up {
  0%   { transform: translateY(0); }
  20%  { transform: translateY(-3px); }
  60%  { transform: translateY(2px); }
  100% { transform: translateY(1px); }
}

@keyframes mf1-spin {
  to { transform: rotate(360deg); }
}

@keyframes mf1-search-box-rect-trace-loop {
  0%   { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -1; }
}
```

#### Easing Functions (CRITICAL — save these)
| Name | Value | Use Case |
|------|-------|----------|
| Primary ease-out | `cubic-bezier(.4, 0, .1, 1)` | General transitions |
| Stack animation | `cubic-bezier(.3, 0, .1, 1)` | Card layout changes |
| Search interaction | `cubic-bezier(0.15, 0.5, 0.05, 1)` | Micro-interactions |
| Smooth scroll | `cubic-bezier(.89, .14, .3, .95)` | Hero stripe reveal |
| Mosaic transition | `cubic-bezier(.5, 0, .9, .55)` | Staggered reveals |
| Stack convergence | `cubic-bezier(.5, 0, .05, 1)` | Compression effects |
| Connector reveal | `cubic-bezier(.3, 0, 0, 1)` | Fly-in elements |
| Text character | `cubic-bezier(.1, .6, .35, 1)` | Typing effect |
| Ease-out cubic (JS) | `x => 1 - Math.pow(1 - x, 3)` | Number counters |

#### Hero Entrance — Staggered Timing
```
Dropbox logo:  0.2s opacity + 0.8s transform
McLaren logo:  0.2s opacity + 0.8s transform + 0.1s delay
Track:         0.8s + 0.2s delay
Timer:         0.8s + 0.25s delay
Speedometer:   0.8s + 0.2s delay
Hero button:   1s + 0.3s delay
```
- Logo pre-reveal state: `translateX(±64px) scale(0.01) opacity(0)`
- Stripe cover: `0.85s cubic-bezier(.89,.14,.3,.95)`
- Reveal triggers 200ms after DOMContentLoaded

#### Scroll-Driven Speedometer
```javascript
const averagingWindow = 150; // ms
const throttleRate = 50;     // ms
const maxSpeed = 10000;      // px/s
const redline = 8000;        // threshold → switches to papaya color
// Formula: avgSpeed = totalDelta / (averagingWindow / 1000)
```
- Radial progress indicator driven by scroll velocity
- Emits custom `speedometerUpdated` event

#### Track SVG Path Following
- Car icon follows SVG path based on scroll percentage
- Uses `getTotalLength()` + `getPointAtLength()` for positioning
- Tangent angle: `Math.atan2(dy, dx) * (180 / PI) - 90`
- Delta for tangent calculation: `0.0025 * totalLength`

#### Stacks Section — 3 Layout Modes
**Freeform** (default):
- 2s transition, `cubic-bezier(.4, 0, .2, 1)`
- Items spread across canvas at unique positions
- First connector hidden (opacity: 0, scale: 0.2)

**Mosaic** (scroll-triggered):
- 0.5s transition, `cubic-bezier(.5, 0, .9, .55)`
- Items shift to tighter grid alignment
- First connector remains hidden

**Stack** (scroll-triggered):
- 0.5s + staggered 0.08s per item, `cubic-bezier(.5, 0, .05, 1)`
- All 6 connectors converge to single point `[0.65, 0.175, 0.5]`
- Y offset: `i * -0.08`, scaled by eased fly progress
- Per-item rotations: `[0, 3, -1.5, 1.5, -2.5, 3]` degrees

#### Search Box Proximity Effect
- Detection range: `20px`
- Mouse offset factors: `xFactor: 0.05`, `yFactor: 0.3`
- Triple-layer box-shadow with varying opacities
- Stroke animation: `stroke-dasharray` from 35% to 100%
- 6 connectors fly in with staggered `0.3s` delays
- Random rotation per connector: `-10deg` to `+10deg`
- Reveal animation: `1.2s cubic-bezier(.3, 0, 0, 1)`

#### Character-by-Character Text Animation
- Each word split into `<span>` elements
- Stagger delay: `(charIndex / totalChars) * 0.3s`
- Transform: `skewX(-20deg) translateX(64px)` → `skewX(0) translateX(0)`
- Color fades from transparent to final

#### Stats Counter Animation
- Duration: 2 seconds
- Easing: `x => 1 - Math.pow(1 - x, 3)` (ease-out cubic)
- Triggers at 20% visibility threshold (IntersectionObserver)
- Preserves decimal places and comma formatting
- Stats: 2,000+ Digital Assets, 1,000+ Team Members, 250m+ Data Points

### WebGL Rendering (Advanced)

#### Security Canvas
- Custom vertex + fragment shaders
- 3D Perlin-like noise function
- 3 spotlight positions with varying sizes: `0.10`, `0.07`, `0.11`
- Blur radius: `0.1`
- Mouse-tracked on desktop, scroll-activated on mobile
- Two texture samplers (idle/active states)

#### Finish Line Canvas
- Checkerboard grid: scale `41.0`
- Y-axis warping: `yCenter / ((pow(yCenterDistance, 0.88) * 7.0) + 1.0)`
- 3D perspective: `perspective(80vw) rotateX(55deg) scale(1.25)` (desktop)
- Papaya + graphite checkerboard pattern

### Scroll Behavior
```css
scrollbar-width: none; /* Firefox */
::-webkit-scrollbar { display: none; } /* Chrome/Safari */
overscroll-behavior: none; /* No bounce */
```

### Performance Optimizations
- Throttled updates: 50ms for speedometer
- IntersectionObserver pauses off-screen canvas rendering
- ResizeObserver debounce: 400ms throttle + 150ms debounce
- Passive event listeners on scroll/mousemove
- requestAnimationFrame loop for 60fps

### What Makes It Special
1. **Zero external animation libraries** — all custom vanilla JS, CSS, and WebGL
2. **Scroll velocity as a design element** — the speedometer turns your scrolling into an interactive experience
3. **WebGL shaders for texture reveals** — security canvas feels magical
4. **Proximity-based interactions** — search box responds before you even click

### What SV Can Steal
- **Easing function library** — those 8 cubic-bezier values are gold for any project
- **Staggered entrance pattern** — delay each element by 0.05-0.1s increments
- **Character-by-character text animation** — split text into spans, stagger with skewX
- **Proximity hover detection** — detect mouse distance before actual hover
- **Stats counter with ease-out cubic** — `x => 1 - Math.pow(1 - x, 3)` over 2 seconds
- **Safe-area-aware margins** — `max(Xpx, env(safe-area-inset))` for notch-safe layouts
- **Scroll-driven layout transitions** — freeform → mosaic → stack pattern
- **Hidden scrollbar pattern** — clean look without losing scroll functionality

---

## SITE 3: MP Motorsport (mpmotorsport.com)

### What It Is
A Webflow-built motorsport team website. Uses GSAP + ScrollTrigger + ScrollSmoother. This is the **stellar template** — structured so cleanly it could work for any organization.

### Typography
| Font | Weights | Role |
|------|---------|------|
| **Saira** | 300, 400, 500, 600, 700 | Primary text |
| **Saira Condensed** | 300, 400, 500, 600, 700 | Compact headings |
| **Saira Semi Condensed** | 300, 400, 500, 600, 700 | Mid-width alternative |

All three from Google Fonts. Global settings:
```css
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-wrap: balance;
}
```

### Color Palette
| Variable | Role |
|----------|------|
| `--base-color-brand--primary` | Blue accent (links, highlights, hover fills) |
| `--base-color-brand--near-black` | Dark backgrounds, pre-animation text color |
| `--base-color-neutral--black` | `#000` true black |
| White `#fff` | Text on dark, card backgrounds |

Colors managed entirely through CSS custom properties — no hard-coded values in component styles.

### The Entrance Animation (STUDY THIS)
```javascript
const ha = gsap.timeline();
// Step 1: Bracket slides in from right
ha.to(haBracket, { right: 0, duration: 0.5 });
// Step 2: 1 second pause (visual beat)
// Step 3: Full overlay slides out to the right
ha.to(homeAnimation, {
  translateX: '100%',
  duration: 0.5,
  delay: 1,
  ease: "power2.in",
  onComplete: () => homeAnimation.remove()
});
```

**The bracket trick:**
```css
#haBracket {
  right: 100%;
  box-shadow: 100vw 0 0 100vw #000;
}
```
This creates a full-screen black overlay using a massive box-shadow. The bracket slides in (revealing the brand mark), pauses, then the entire overlay slides away to reveal the page. The element is removed from DOM after animation. Total duration: ~2 seconds.

**Why it works:** It's a curtain reveal. The audience sees the brand mark first (bracket), then the full site. Simple, fast, memorable.

### Navigation System

**Desktop:**
- Standard horizontal nav with animated underline indicator
- Active state tracked via URL segment matching: `currentUrl.includes(linkAttrValue)`
- Underline (`#nav-back`) repositions per link:
  - Link 2: `width: 143px; right: 327px`
  - Link 3: `width: 127px; right: 200px`
  - Link 4: `width: 91px; right: 109px`
  - Link 5: `width: 99px; right: 10px`
- Uses `ms-code-nested-link` attribute for dynamic URL matching

**Mobile hamburger:**
```css
.w--open .burger-stripe:nth-child(1) { transform: rotate(-45deg) translateY(50%); }
.w--open .burger-stripe:nth-child(2) { display: none; }
.w--open .burger-stripe:nth-child(3) { transform: rotate(45deg) translateY(-50%); }
```
Animation: `data-animation="over-right"` — menu slides in from the right.

### GSAP Animation System (COMPLETE REFERENCE)

**ScrollSmoother Config:**
```javascript
ScrollSmoother.create({
  content: '.page-wrapper',
  smooth: 1.5,
  effects: false
});
```

#### Appear Heading (Character-Level Color Transition)
```javascript
gsap.from(chars, {
  scrollTrigger: { trigger, start: "top 80%", end: "bottom 40%", scrub: true },
  color: "var(--base-color-brand--near-black)",
  stagger: 0.75
});
```
Text is split into individual character `<span>`s. As you scroll, characters transition from near-black to their final color, creating a "typing/revealing" effect.

#### Directional Entrances
| Attribute | Transform | Duration | Trigger |
|-----------|-----------|----------|---------|
| `[in-from="left"]` | `translateX(-100%)` | 2s | top bottom → center |
| `[in-from="zoom"]` | `scale(0.5)` | 0.5s, stagger 0.2 | top bottom → center |
| `[in-from="fade-bottom"]` | `translateY(100), opacity: 0` | 1s | top bottom → center |

#### Grid Line Animation
```javascript
gsap.from(gridline, {
  "--borderFrom": "100vw",  // CSS variable drives border width
  scrollTrigger: { trigger, start: "top 70%" },
  duration: 0.5
});
```

#### Parallax via Data Attributes
```javascript
// Any element with data-speed attribute
gsap.from(element, {
  translateY: speed * 100,
  scrollTrigger: { trigger, start: "top bottom", end: "top 20%", scrub: true }
});
```

#### Horizontal Text Scroll
```javascript
gsap.to(line, {
  x: direction === "right" ? '+50%' : '-50%',
  scrollTrigger: { trigger: document.body, scrub: true }
});
```

#### Pin Elements
```javascript
ScrollTrigger.create({
  trigger: pinEl.closest('.pin-container'),
  start: "top " + headerHeight,
  end: "bottom bottom",
  pin: pinEl,
  pinSpacing: pinSpacingVal
});
```

#### Button Hover
```css
@keyframes moveBg {
  from { background-position: 0 center; }
  to   { background-position: 100% center; }
}
.button-full:hover {
  animation: moveBg 1s linear infinite;
}
```

### Card Hover Effects

**Driver/News Cards:**
```css
.driver-card:hover::after,
.news-card:hover::after {
  transform: translateX(10px); /* Arrow slides right */
  transition-duration: 0.3s;
}

.driver-card:hover .driver-card-image {
  transform: scale(1.1);
  transition-duration: 0.3s;
}
```

**Competition Widget (background fill on hover):**
```css
.competition-widget-text::before {
  width: 0%;
  background: var(--base-color-brand--primary);
}
.competition-widget-item:hover > .competition-widget-text::before {
  width: 150%;
  transition-duration: 0.5s;
}
```

### Site Structure as a Template

```
HOME PAGE:
├── [ENTRANCE ANIMATION] — Brand reveal (bracket + curtain)
├── [HERO] — Background video + headline ("Accelerating Talent")
│   └── Play/pause button, fallback poster image
├── [COMPETITIONS] — 6-card grid of series
│   └── Each card: name + hover background fill
├── [BUSINESS CTA] — Call-to-action section
├── [DRIVER CAROUSEL] — Splide slider
│   └── type: loop, padding: 25%, autoplay: 3s, speed: 2s
├── [NEWS] — 3 cards (2 on tablet, hides 3rd)
├── [FOOTER]
    ├── Logo
    ├── Social: Instagram, TikTok, Facebook
    ├── Nav columns: MP, Competitions, Drivers, Business
    └── Copyright + Privacy Policy

INNER PAGES (Drivers):
├── [HERO TITLE] — "Accelerating Talent" with appear animation
├── [COMPETITION SECTIONS] x6 — Each loads drivers dynamically
│   └── jQuery: $('#drivers-[name]').load("[url] .competition-drivers")
├── [DRIVER GRID] — Responsive columns
│   └── Desktop: 3 cols | Tablet: 2 cols | Mobile: 1 col
└── [FOOTER]
```

### Layout System

**Containers:**
- `.container-medium`, `.container-small`, `.container-large`
- All: `margin: auto` centered

**Responsive Breakpoints:**
| Breakpoint | Target |
|------------|--------|
| `1400px+` | Desktop (nav margin-left: 265px) |
| `991px` | Tablet (`.hide-tablet`) |
| `767px` | Mobile landscape (`.hide-mobile-landscape`) |
| `479px` | Mobile (`.hide-mobile`) |

**Spacing Utilities:**
- `.margin-0`, `.padding-0`, `.spacing-clean` → `0rem`
- `.margin-vertical`, `.padding-vertical` → clear horizontal
- Bracket spacing: `.driver-content { padding-right: 10vw }`

**Splide Carousel Responsive Config:**
```javascript
// Driver carousel
{ type: 'loop', padding: '25%', perPage: 1, autoplay: true, interval: 3000, speed: 2000 }

// Sponsor carousel breakpoints
1200px+: 9 items
991px:   4 items
767px:   3 items
479px:   2 items
```

### Image & Media Handling
```html
<!-- Background video with fallback -->
<figure data-wf-bgvideo-fallback-img>
  <img src="[poster.jpg]">
  <video><button class="play-pause"></button></video>
</figure>
```
```css
@media (prefers-reduced-motion: reduce) {
  [data-wf-bgvideo-fallback-img] {
    display: inline-block;
    object-fit: cover;
  }
}
```
- Images served via CDN: `cdn.prod.website-files.com`
- Decorative bracket SVGs via `background-image` on pseudo-elements
- Driver images: `:nth-child(even) { margin-left: auto }` for staggered alignment

### Tech Stack
- Webflow (hosting, CMS, forms)
- GSAP (ScrollTrigger, ScrollSmoother)
- Splide.js (carousels)
- jQuery (dynamic content loading)
- Google Tag Manager (`GTM-PP9PWCL7`)

### What Makes It Special
1. **The entrance animation** — a 2-second bracket/curtain reveal that costs almost nothing but makes the site feel premium
2. **Universal template structure** — hero → cards → carousel → news → footer works for literally any organization
3. **Character-level scroll animations** — text reveals character by character as you scroll, adding dynamism without distraction

### What SV Can Steal
- **Bracket entrance animation** — GSAP timeline, box-shadow trick, element removal after animation
- **Character split + scroll color reveal** — split `.appear-heading` into char spans, GSAP scrub from near-black to final color
- **Competition widget hover** — `::before` pseudo-element width from 0% to 150% for background fill
- **Driver card hover pattern** — arrow translateX(10px) + image scale(1.1), both 0.3s
- **ScrollSmoother with smooth: 1.5** — adds natural momentum to scrolling
- **Data-speed parallax** — simple attribute-driven parallax system
- **Responsive card grid** — 3 → 2 → 1 columns with clean breakpoints
- **Splide carousel config** — loop, 25% padding peek, 3s autoplay
- **`text-wrap: balance`** on all elements — modern CSS for better text layout
- **Reduced motion respect** — `prefers-reduced-motion` media query for video fallback

---

## CROSS-SITE PATTERNS — What Unifies Great Sites

### Typography Patterns
| Site | Heading Font | Body Font | Strategy |
|------|-------------|-----------|----------|
| GP Canada | Roboto Slab (serif) | Titillium Web (sans) | Serif/sans contrast |
| McLaren/Dropbox | System/custom | System/custom | Minimal, let animations speak |
| MP Motorsport | Saira family (3 widths) | Saira family | Single family, width variation |

**Takeaway:** Either use a serif/sans pair for contrast, or use a single super-family with width variants. Never more than 2-3 font families.

### Animation Philosophy
| Site | Library | Approach |
|------|---------|----------|
| GP Canada | Barba.js | Page transitions only — content is static |
| McLaren/Dropbox | None (vanilla) | Everything custom — scroll velocity, WebGL, proximity |
| MP Motorsport | GSAP ecosystem | ScrollTrigger for everything, data attributes for config |

**Takeaway:** GSAP + ScrollTrigger is the sweet spot for SV. It covers 90% of what the McLaren site does with 10% of the code. Barba.js on top for page transitions.

### Color Strategy
- All three sites use CSS custom properties for colors
- Dark backgrounds dominate (graphite/black)
- Single strong accent color (papaya orange, blue, red)
- White text on dark is the primary reading experience

### Layout Architecture
- All three: hero → content blocks → footer
- Max-width containers with auto margins
- CSS Grid for complex layouts, Flexbox for simpler ones
- Responsive via breakpoints, not fluid scaling

---

## IMPLEMENTATION PRIORITY FOR SV

### Tier 1 — Do This Week
1. **Save the easing function library** from McLaren — 8 production-ready cubic-bezier values
2. **Build a GSAP ScrollTrigger starter** using MP Motorsport patterns (appear-heading, fade-bottom, parallax)
3. **Implement `text-wrap: balance`** globally on all SV projects

### Tier 2 — Next Sprint
4. **Build the bracket entrance animation** from MP Motorsport as a reusable component
5. **Implement Barba.js** on multi-page client sites for smooth transitions
6. **Create a character-split animation utility** (split text → span per char → stagger animation)

### Tier 3 — Template Library
7. **Build the "Stellar Template"** based on MP Motorsport structure:
   - Entrance animation → Hero video → Card grid → Carousel → News → Footer
8. **Build the "Event Template"** based on GP Canada:
   - Hub page → Spoke pages (hero → CTA → details → logistics → newsletter)
9. **Build proximity hover detection** from McLaren as a reusable JS utility

### Tier 4 — Advanced
10. **Scroll velocity indicator** concept from McLaren — could be adapted as a creative element for racing/speed clients
11. **WebGL texture reveals** — build a simplified version of the security canvas for portfolio pieces
12. **Stats counter component** with ease-out cubic easing and IntersectionObserver trigger
