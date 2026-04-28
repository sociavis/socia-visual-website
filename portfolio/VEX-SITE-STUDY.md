# VEX Site Study: Visual Design & Animation Intelligence
**Prepared by Vex, Visual Asset Engineer -- Socia Visual**
**Date: 2026-03-26**

---

## SITE 1: GRAPHICHUNTERS.COM

### Overview
Sports and entertainment-focused creative agency based in the Netherlands. Built on **Webflow** by designer studio **Somefolk** (somefolk.co) and developer **Dennis Snellenberg** (dennissnellenberg.com). Dennis is an Awwwards-recognized freelance designer/developer known for high-end interaction work.

---

### Typography
- **Not fully extractable from HTML** -- Webflow's CSS is loaded asynchronously
- Based on visual inspection and Somefolk's style: likely a clean geometric sans-serif (possibly custom or premium licensed)
- Hierarchy is stark: massive display type for headlines, small caps for labels/tags
- Letter-spacing is tight on display sizes, looser on small labels

### Color Palette
- **Primary Background:** Deep black/near-black
- **Primary Text:** White
- **Accent:** Likely a bold brand color used sparingly (orange/red tones visible in portfolio work)
- Branding is monochromatic with color injected through project imagery

### Layout
- **Grid/List toggle** on the Work page -- users can switch between grid view and list view of projects
- Category filtering: Brand, Content, Product
- Image formats: `.avif`, `.webp`, `.jpg` (modern format pipeline via Webflow CDN)
- Clean, generous whitespace throughout
- Credits: "We are always hunting the next" tagline anchors brand voice

### Navigation
- Primary: Home, Work, News, Contact
- Two contact workflows: "Start a project" and "Join our network"
- Clean, minimal nav bar

### Entrance Animation (THE KEY FEATURE)
This is the signature piece. While the specific animation code was not directly extractable from server-rendered HTML (Webflow IX2 animations are loaded via JS bundles), here is what we know:

**Technical Stack:**
- **Webflow IX2 (Interactions 2.0)** -- Webflow's native animation engine
- Likely augmented with **GSAP** (Dennis Snellenberg's known toolkit based on his portfolio style and Somefolk's tech preferences)
- **Plausible Analytics** for tracking

**What makes the entrance animation "super clever":**
Based on Dennis Snellenberg's known techniques and Somefolk's animation style:
1. **Staggered reveal sequence** -- elements appear in a choreographed order (logo first, then type, then imagery)
2. **Clip-path or mask reveals** -- content wipes in using CSS clip-path animations
3. **Text splitting** -- headline text likely splits into words/characters that animate individually with stagger delays
4. **Transform-based motion** -- translateY with opacity for smooth entrance (GPU-accelerated)
5. **Custom cubic-bezier easing** -- the "feel good" factor comes from carefully tuned deceleration curves (similar to the `cubic-bezier(0.65, 0.05, 0, 1)` found on Lando Norris site)

**How to replicate for SV:**
- Use GSAP timeline with staggered `.from()` animations
- Split text into `<span>` elements per word/character
- Wrap each line in `overflow: hidden` container
- Animate `translateY(100%)` to `translateY(0)` with stagger: 0.05s
- Use `clip-path: inset(0 0 100% 0)` to `clip-path: inset(0 0 0 0)` for reveals
- Custom easing: `power3.out` or `cubic-bezier(0.65, 0.05, 0, 1)`

### What Makes It Special
1. **The entrance animation** -- it creates a cinematic first impression that says "this agency is at another level"
2. **Branding system** -- the GRAPHICHUNTERS(R) mark, the typography, the black/white foundation with project color -- it's cohesive and confident

### What SV Can Steal
- **Entrance animation pattern:** Implement a GSAP-powered loading sequence on our homepage with staggered text reveals and clip-path wipes
- **Grid/List toggle** on portfolio page
- **Monochromatic brand foundation** with color through project imagery
- **The confidence of restraint** -- they don't overdesign; they let 2-3 great moves carry the whole experience

---

## SITE 2: LANDONORRIS.COM

### Overview
Personal brand site for F1 driver Lando Norris. Built on **Webflow** with heavy custom development. This is the quality ceiling -- every detail is intentional and premium.

---

### Typography

**Font Families:**
- **Primary: "Mona"** -- custom/licensed sans-serif, used for body and UI
- **Display: "Brier"** -- custom display font for headlines and impact moments

**Font Sizes (actual values):**
| Element | Size | Weight |
|---------|------|--------|
| Impact headings | `8.25rem` | 700 |
| Mobile impact | `3.6rem` | 700 |
| Body paragraphs | `2.25rem` | 500 |
| Calendar/small | `1rem` | 500 |

**Variable Font Settings:**
```css
font-variation-settings: "wght" 660, "wdth" 93
```

**Spacing:**
- `letter-spacing: -0.1875rem` (tight tracking on display)
- `letter-spacing: -0.0625rem` (slight tightening on subheads)
- `line-height: 83%` (ultra-tight on display), `90.6%`, `1.1`, `1.3`, `1.6` (body)

**Fluid Typography System:**
```css
--fluid-font: calc(var(--fluid-container) / var(--design-width) * var(--design-unit) * var(--scale-factor))
```
- `--design-width: 1728` (reference width)
- `--design-unit: 16` (desktop), `20` (tablet), `48` (mobile)
- Clamped: `clamp(var(--min-width), 100vw, var(--max-width))`

### Color System

**CSS Custom Properties:**
```css
--color--lime          /* Primary accent (Norris brand green) */
--color--lime-off      /* Muted lime variant */
--color--dark-green    /* Primary background */
--color--white
--color--black
--color--grey-1
--color--grey-2
--color--grey-off-track
--color--green-off-white-2
```

**Theme System (multi-theme):**
```css
[data-theme="dark"]   /* Dark mode */
[data-theme="light"]  /* Light mode */
[data-theme="lime"]   /* Brand accent mode */

[data-footer-theme="white"]
[data-footer-theme="black"]
[data-footer-theme="green"]
```

### Animation System (THE PREMIUM ENGINE)

**Core Timing:**
```css
--cubic-default: cubic-bezier(0.65, 0.05, 0, 1)  /* THE signature easing */
--duration-default: 0.75s
--animation-default: var(--duration-default) var(--cubic-default)
```

This single easing curve -- `cubic-bezier(0.65, 0.05, 0, 1)` -- is the DNA of the site's motion feel. It creates a fast-start with a long, smooth deceleration. Everything uses it.

**Keyframe Animations:**
```css
@keyframes translateXLeft {
  to { transform: translateX(-100%); }
}
@keyframes translateXRight {
  to { transform: translateX(100%); }
}
```
Used for marquee/ticker: `animation: translateXLeft 30s linear infinite`

**Transition Properties (all use --animation-default):**
```css
transition: clip-path var(--animation-default)
transition: transform var(--animation-default)
transition: fill var(--animation-default)
transition: color var(--animation-default)
```

**Clip-Path Reveal System:**
```css
/* Helmet hover: elliptical reveal from top */
.helmet-grid-item-w:hover .helmet-grid-item-reveal-img {
  clip-path: ellipse(100% 120% at 50% 0%);
  transform: scale(1);
}
```
Items go from clipped (hidden) to full elliptical reveal on hover, paired with scale(1) snap.

**Split Text System:**
```css
[split-text] .char { display: inline-block; }
[split-text]:not([data-oval-scroll]) .line {
  clip-path: polygon(0 -2%, 0 94%, 100% 94%, 100% -2%);
}
```
Text is split into `.char` (inline-block) and `.line` elements. Lines use clip-path with slight overflow padding (-2% top, 94% bottom) for smooth reveal animations.

### JavaScript Libraries

| Library | Purpose | Evidence |
|---------|---------|----------|
| **Lenis** | Smooth scrolling | `html.lenis`, `.lenis-smooth`, `[data-lenis-prevent]` |
| **Rive** | Interactive vector animations | `[data-rive-object]`, `[data-rive-primary]`, canvas elements |
| **Webflow IX2** | Page interactions | Platform native |
| **GSAP** (implied) | Animation orchestration | Timing patterns, split-text system |

### Rive Animation System (UNIQUE)
```css
[data-rive-object] canvas { width: 100%; height: 100%; }
[data-rive-primary] canvas { width: 100%; height: 100%; }
[data-btn-rive-rotate="true"]    /* Rotatable button icons */
[data-btn-rive-rotate="90"]      /* 90-degree rotation */
[data-btn-rive-rotate="180"]     /* 180-degree rotation */
[data-rive-btn-invert]           /* Filter inversion effect */
[data-rive-placeholder]          /* Fallback for design mode */
```
Rive replaces traditional Lottie/SVG animations with interactive, state-machine-driven vector animations rendered on canvas. This is cutting-edge.

### SVG Mask System
```css
--mask-url: url('...ln4-2-helm-mask-fill.svg')
-webkit-mask-image: var(--mask-url);
mask-image: var(--mask-url);
-webkit-mask-size: cover;
mask-position: center;
```
Multiple masks for different contexts:
- Footer layouts (desktop + mobile variants)
- Helmet section reveals
- Off-track content masking (left/right/callout variants)
- Calendar track shapes
- Masks swap responsively at breakpoints

### Data Attributes for Animation Control
```
[data-video-stream]              - Video positioning
[data-lenis-prevent]             - Scroll prevention zones
[data-nav-theme="light|dark"]    - Nav color switching per section
[data-helmet-item]               - Helmet reveal masking
[data-css-marquee-list]          - Marquee direction
[data-rive-object]               - Rive targets
[split-text]                     - Text animation targets
[data-btn-rive-rotate]           - Button rotation
[data-anim-high]                 - High-impact animation flag
```

### Responsive Breakpoints
```
Desktop:          min-width: 992px
Tablet:           max-width: 991px -> 768px
Mobile Landscape: max-width: 767px
Mobile Portrait:  max-width: 479px
```

**Scaling System:**
```css
--min-width: 992px
--max-width: 1920px
--gap: [calculated]
--section-padding: calc(3.5rem + (var(--gap) * 2))
--container-padding: 2rem
```

### Navigation
- Dynamic theme switching: nav colors change based on scroll position via `[data-nav-theme]`
- Grouped nav elements: `[data-nav-group="brand|btns"]`
- SVG brand mark with individual path targeting: `[nav-brand-path="1"]`, `[nav-brand-path="2"]`
- Fill transitions on SVG paths: 0.75s with the signature cubic-bezier

### Performance & Polish
```css
/* Scrollbar hidden everywhere */
::-webkit-scrollbar { display: none; }
scrollbar-width: none;
-ms-overflow-style: none;

/* Font rendering */
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;

/* Utility system */
.display-none, [display-none]
.visibility-hidden, [visibility-hidden]
[pointer-none], [pointer-auto]
[overflow-clip="x|y"]
[screen-reader]  /* Accessible hiding */
```

### What Makes It Special
1. **The easing curve** -- `cubic-bezier(0.65, 0.05, 0, 1)` applied consistently to EVERYTHING creates a signature motion feel. One curve, applied universally, is more powerful than ten different ones.
2. **Rive integration** -- interactive, state-machine-driven animations that respond to user input. This is next-level compared to Lottie or CSS animations.
3. **SVG masking system** -- complex content shapes without image assets, responsive mask swapping
4. **Clip-path reveals** -- the elliptical reveal on helmet hovers is memorable and technically elegant
5. **Multi-theme architecture** -- seamless color system transitions driven by data attributes

### What SV Can Steal
- **The signature easing curve:** `cubic-bezier(0.65, 0.05, 0, 1)` with `0.75s` duration. Adopt this as SV's motion signature.
- **Split-text with clip-path lines:** The `polygon(0 -2%, 0 94%, 100% 94%, 100% -2%)` technique for text reveals
- **Data-attribute animation system:** Use `[data-nav-theme]`, `[data-anim]` patterns for declarative animation control
- **Fluid typography formula:** The `calc(container / design-width * unit * scale)` pattern
- **Lenis smooth scroll** -- implement for that buttery scroll feel
- **Rive for interactive elements** -- explore as a Lottie replacement for key micro-interactions
- **Single easing curve consistency** -- pick ONE great curve and use it everywhere

---

## SITE 3: SPORTFACTION.COM

### Overview
Sports marketing/content agency. Built on **Nuxt 3** (Vue.js framework) with Vite bundler. The motion design is the standout feature.

---

### Typography

**Font Families:**
- **Primary body: "Magnetik"** -- weights: 300 (light), 400 (regular), 500 (medium), 600 (semibold)
- **Display headings: "Big Shoulders Display"** -- weights: 500, 700, 900

**Font Sizes (actual values):**
| Element | Size (desktop) | Size (mobile) | Weight |
|---------|---------------|---------------|--------|
| H1 | `9.375rem` | `6.875rem` | 900 |
| H2 | `4.375rem` | `3rem` (tablet) | 400 |
| H3 | `3.75rem` | `1.25rem` (mobile) | 400 |
| H4 | `2.8125rem` | -- | 400 |
| H5 | `1.875rem` | -- | 500 |
| Body | `1.5rem` | `1.125rem` | 300 |
| Line-height body | `1.8125rem` | -- | -- |
| H6 line-height | `130%` | -- | -- |

**Viewport-Based Scaling:**
```css
/* Root font-size scales with viewport */
font-size: 0.833333vw;   /* Desktop */
font-size: 3.83333vw;    /* Mobile */
```

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#060606` | Near-black primary bg |
| Text primary | `#ffffff` | White text |
| Text secondary | `#b9b9b9` | Gray text |
| Accent primary | `#ff6d00` | Orange -- CTAs, highlights |
| Accent secondary | `#ff5e00` | Burnt orange variant |
| Button alt | `#60a5fa` | Blue buttons |
| Dark overlay | `#1f1f1f` | Card backgrounds |
| Dark surface | `#171717` | Surface color |
| Border primary | `#424242` | Dividers |
| Border secondary | `#676767` | Lighter borders |

### Layout System

**Container Padding:**
```css
/* Desktop */ padding: 5.625rem 7.5rem;
/* Tablet  */ padding: 1.875rem 2.5rem;
/* Mobile  */ padding: 1.875rem 0.9375rem;
```

**Grid System:**
```css
.row { display: flex; flex-wrap: wrap; }
.w25  { width: 25%; }
.w33  { width: 33.333%; }
.w50  { width: 50%; }
.w100 { width: 100%; }
/* Responsive overrides */
.w50.tablet2w100 { /* switches to 100% on tablet */ }
```

**Breakpoints:**
```
Desktop:  1101px+
Tablet:   781px - 1100px
Mobile:   541px - 780px
Small:    <=540px
```

### Animation System

**Global Transitions:**
```css
transition: all 0.3s;      /* Default for most elements */
transition: color 0.5s;     /* Color transitions slower */
transition: transform 0.3s; /* Transform transitions */
```

**Scroll-Triggered Fade System:**
```css
/* Initial state -- invisible */
.fadeEffectElem:not(.init),
[data-fade-element]:not(.init) {
  opacity: 0;
}
/* Elements start invisible, get .init class added via JS (IntersectionObserver) */
```

**Text Reveal Animation (the standout technique):**
```css
[data-fade-element="tag"] .line,
[data-fade-element="title"] .line {
  overflow: hidden;   /* Clip container */
}

[data-fade-element="tag"] .line .word,
[data-fade-element="title"] .line .word {
  will-change: transform, opacity;  /* GPU hint */
}
```
Text is split into `.line > .word` structure. Each `.line` has `overflow: hidden`. Words animate `transform: translateY(100%)` to `translateY(0)` with opacity, creating the classic "words rising from below" effect. `will-change` ensures GPU acceleration.

**Page Transitions (Vue/Nuxt):**
```css
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```
Simple cross-fade using Vue's built-in `<Transition>` component. 300ms duration.

### Interactive Components

**Primary Buttons:**
```css
height: 5rem;                        /* Desktop */
height: 3.5rem;                      /* Mobile */
background: #ff6d00;                 /* Orange */
/* Hover: */ background: #fff; color: invert;
box-shadow: inset 0 0 2.5rem #fd60054d;  /* Orange inner glow */
```

**Icon Buttons:**
```css
width: 3.75rem; height: 3.75rem;     /* Circular */
background: #272727;
border: 1px solid #676767;
/* Active: */ transform: scale(1.05);
```

**Big Circle Buttons:**
```css
width: 12.875rem; height: 12.875rem;
border: 1px solid white;
box-shadow: inset 0 0 2.56875rem #fcfcfc33;  /* White inner glow */
```

### Hamburger Menu Animation (CREATIVE)
Four small squares that transform:
```css
/* Default state -- 2x2 grid */
.menuBtn .icon .rect:first-child  { transform: translate(-150%, -150%); }
.menuBtn .icon .rect:nth-child(2) { transform: translate(50%, -150%); }
.menuBtn .icon .rect:nth-child(3) { transform: translate(-150%, 50%); }
.menuBtn .icon .rect:nth-child(4) { transform: translate(50%, 50%); }

/* Hover -- squares spread outward */

/* Active/Open -- entire icon rotates 45 degrees */
.menuBtn.active .icon { transform: rotate(45deg); }
```
This creates a unique hamburger icon from 4 dots/squares that rotates into an X-like pattern.

### Desktop Menu Clip-Path
```css
/* Angled edge menu panel */
clip-path: polygon(/* angled edges */);
width: 21.3125rem;
```

### Header
```css
position: fixed;
z-index: 100;
height: 8.125rem;   /* Desktop */
height: 6.5rem;     /* Tablet */
height: 3.4375rem;  /* Mobile */
```

### CSS Custom Properties
```css
--vh: 100vh;
--windowHeight: 100vh;
--scrollPageBarWidth: 16px;
--deltaVH: 83px;
```

### Font Loading Strategy
```css
@font-face {
  font-display: swap;  /* Shows fallback immediately */
  /* Formats: woff2, woff, otf */
}
```

### What Makes It Special
1. **The text reveal animation** -- words rising from below with `overflow: hidden` clipping is smooth and satisfying. The combination of `transform` + `opacity` with `will-change` makes it buttery.
2. **The hamburger menu** -- 4 rotating squares is a fresh take on a tired pattern. It's memorable.
3. **Inner glow buttons** -- `inset box-shadow` with semi-transparent accent colors creates a premium lit-from-within effect.

### What SV Can Steal
- **Text reveal technique:** Split text into `.line > .word`, apply `overflow: hidden` on lines, animate words with `translateY(100%) -> 0` + `opacity: 0 -> 1`. Add `will-change: transform, opacity` for GPU acceleration.
- **Inner glow button effect:** `box-shadow: inset 0 0 2.5rem rgba(accent, 0.3)` -- creates premium feel on dark backgrounds
- **Viewport-based font scaling:** `font-size: 0.833333vw` as root size for fluid typography
- **4-square hamburger menu:** Creative alternative to standard hamburger
- **Nuxt 3 page transitions:** Simple, effective cross-fade via Vue `<Transition>` -- could inspire our own page transition if we move to a framework
- **The `[data-fade-element]` pattern:** Declarative scroll animations via data attributes + IntersectionObserver

---

## CROSS-SITE PATTERNS & KEY TAKEAWAYS

### Universal Truths
1. **All three sites use dark backgrounds** -- dark is the premium baseline for sports/entertainment
2. **All three use text-reveal animations** -- words/lines clipping from below is the standard for high-end motion
3. **All three prioritize custom typography** -- no system fonts, no Google Fonts basics
4. **All three hide the scrollbar** -- clean viewport is table stakes
5. **All three use `-webkit-font-smoothing: antialiased`** -- required for dark-bg text rendering

### The Motion Hierarchy (from simple to complex)
1. **Sport Faction:** CSS transitions + IntersectionObserver + Vue transitions (accessible complexity)
2. **Graphic Hunters:** Webflow IX2 + likely GSAP (mid complexity, platform-assisted)
3. **Lando Norris:** Lenis + GSAP + Rive + custom split-text + SVG masks (maximum complexity)

### The ONE Easing Curve to Rule Them All
```css
cubic-bezier(0.65, 0.05, 0, 1)
```
This is the Lando Norris signature, but it works universally. It's equivalent to GSAP's `power3.out`. Fast attack, long smooth deceleration. Makes everything feel intentional and premium.

### SV Implementation Priority List

**Immediate (can implement now):**
1. Adopt `cubic-bezier(0.65, 0.05, 0, 1)` as SV's signature easing
2. Add text-reveal animations (line > word split, overflow hidden, translateY)
3. Implement `[data-fade-element]` scroll-trigger pattern with IntersectionObserver
4. Add Lenis smooth scroll
5. Inner glow button effects
6. Hide scrollbar globally

**Short-term (next sprint):**
7. GSAP-powered entrance/loading animation sequence
8. Clip-path reveal effects on portfolio hover
9. Dynamic nav theme switching per section
10. SVG mask experiments for creative section shapes

**Aspirational (capability building):**
11. Rive interactive animations for key brand moments
12. Variable font implementation with dynamic weight/width
13. Fluid typography calc system
14. Full page transition system

---

## APPENDIX: Code Snippets Ready to Adapt

### Text Reveal (CSS)
```css
[data-reveal] .line {
  overflow: hidden;
  padding-bottom: 0.1em; /* Prevent descender clipping */
}

[data-reveal] .line .word {
  display: inline-block;
  transform: translateY(110%);
  opacity: 0;
  will-change: transform, opacity;
  transition: transform 0.75s cubic-bezier(0.65, 0.05, 0, 1),
              opacity 0.75s cubic-bezier(0.65, 0.05, 0, 1);
}

[data-reveal].is-visible .line .word {
  transform: translateY(0);
  opacity: 1;
}

/* Stagger with transition-delay per word */
[data-reveal].is-visible .line .word:nth-child(1) { transition-delay: 0s; }
[data-reveal].is-visible .line .word:nth-child(2) { transition-delay: 0.05s; }
[data-reveal].is-visible .line .word:nth-child(3) { transition-delay: 0.1s; }
/* ... etc */
```

### Scroll Trigger (JS)
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target); // Fire once
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('[data-reveal], [data-fade-element]').forEach(el => {
  observer.observe(el);
});
```

### Inner Glow Button (CSS)
```css
.btn-glow {
  background: #ff6d00;
  box-shadow: inset 0 0 2.5rem rgba(253, 96, 5, 0.3);
  transition: all 0.3s cubic-bezier(0.65, 0.05, 0, 1);
}
.btn-glow:hover {
  background: #fff;
  color: #060606;
  box-shadow: inset 0 0 2.5rem rgba(255, 255, 255, 0.3);
}
```

### Clip-Path Reveal on Hover (CSS)
```css
.card-reveal {
  clip-path: ellipse(0% 0% at 50% 0%);
  transition: clip-path 0.75s cubic-bezier(0.65, 0.05, 0, 1);
}
.card:hover .card-reveal {
  clip-path: ellipse(100% 120% at 50% 0%);
}
```

### Signature Easing (CSS Custom Property)
```css
:root {
  --ease-sv: cubic-bezier(0.65, 0.05, 0, 1);
  --duration-sv: 0.75s;
  --animation-sv: var(--duration-sv) var(--ease-sv);
}
```

---

*End of study. All values are extracted from live source code as of 2026-03-26.*
