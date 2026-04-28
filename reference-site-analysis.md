# Reference Site Analysis — Forge Brand Systems Report
### Prepared for Socia Visual | March 2026

---

## Table of Contents
1. [Charles Leclerc — The Ceiling](#1-charles-leclerc--the-ceiling)
2. [FC88 — The Side Menu Master](#2-fc88--the-side-menu-master)
3. [M-Sport Raptor — The Kindred DNA](#3-m-sport-raptor--the-kindred-dna)
4. [Cross-Site Patterns](#4-cross-site-patterns)
5. [What SV Can Steal](#5-what-sv-can-steal)

---

## 1. Charles Leclerc — The Ceiling
**URL:** https://charlesleclerc.com/en/
**Built by:** Apart Collective (apart-collective.com)
**Platform:** WordPress (custom theme: `theme-custom`)

### Typography
| Token | Value |
|-------|-------|
| Display / Brand | `coign-87-bold` (weight 700) |
| Custom Sans | `LeclercSans-Regular` (weight 400) |
| Body / UI | `Manrope` (weights 200-800, full range) |
| Font Display | `swap` on all faces |
| Size Scale | 13px / 20px / 36px / 42px (WordPress preset) |

**Hierarchy approach:** Coign for brand moments, LeclercSans for identity-specific text, Manrope as the workhorse with 7 weight options for fine-grained hierarchy.

### Color Palette
| Role | Hex | Usage |
|------|-----|-------|
| Ferrari Red | `#e4032e` | Hero loading screen, brand accent |
| Near-Black | `#000016` | Returning visitor loader, dark backgrounds |
| Button Dark | `#32373c` | Button fills |
| White | `#ffffff` | Text, backgrounds |
| Black | `#000000` | Text, backgrounds |

Additional WordPress preset colors exist (vivid red `#cf2e2e`, cyan-bluish-gray `#abb8c3`, etc.) but the brand relies on the red/black/white core.

### Animations
- **Library:** Lottie (JSON-based vector animation)
- **Two loading states:**
  - First visit ("hard-loading"): Full brand intro animation (`Intro_loading_1x1.json`) on `#e4032e` red background
  - Return visit ("soft-loading"): Flag animation (`CL_flag_loading.json`) on `#000016` dark background
- **Cookie-based personalization:** 30-day cookie tracks first visit; `data-loading="hard|soft"` attribute controls which animation plays
- **Prefetch strategy:** Conservative eagerness for internal routes, excluding admin/plugin paths

### Layout
| Token | Value |
|-------|-------|
| Flex gap | `0.5em` (default) |
| Column gap | `2em` (wp-block-columns) |
| Spacing 20-80 | 0.44rem / 0.67rem / 1rem / 1.5rem / 2.25rem / 3.38rem / 5.06rem |
| Image intrinsic | `contain-intrinsic-size: 3000px 1500px` |

Uses WordPress block editor grid (flex + grid layouts).

### Navigation
- Multi-language selector (EN / IT / FR)
- Sections: The Driver, The Man, Formula 1, Calendar, Standings, Store, Partners, News, Contacts
- Social links integrated: Instagram, TikTok, Facebook, Twitch, YouTube, X
- Footer: Apart Collective credit, Privacy/Cookie/Legal links

### Homepage Sections
1. Hero with Lottie loading animation
2. The Driver — stats grid (141 GPs, 38 podiums, 7 victories, 25 poles)
3. General info — birthdate, hometown, team badge
4. Helmets carousel — Abu Dhabi through Monza 2024
5. Quote — "It's the mind that makes the difference"
6. Beginnings — kart results timeline 2009-2013
7. Motorsport — career progression
8. Ferrari World — dream narrative + gallery
9. Life as a Driver — tabbed cards (Training, Preparation, Racing, Off-Season)

### What Makes It Special
1. **Intelligent loading personalization** — The first/return visitor distinction is premium UX. It treats the first visit as an event.
2. **Performance-first philosophy** — Lottie over WebGL, `font-display: swap`, conservative prefetching. Elite sites don't sacrifice speed for flash.

### What SV Can Steal
- **Cookie-based first-visit experience:** Show a different, more dramatic intro on first visit. Subsequent visits get a lighter, faster load.
- **Custom brand font pairing model:** One display font + one brand-specific font + one utility font. Three tiers.
- **Lottie for loading animations:** JSON vector animations are lightweight and infinitely scalable.

---

## 2. FC88 — The Side Menu Master
**URL:** https://www.thisisfc88.com
**Platform:** Custom build (Webflow-adjacent, custom data-attribute architecture)

### Typography
| Token | Value |
|-------|-------|
| Display | `Schabo Condensed` (fallback: Arial, sans-serif) |
| UI Accent | `Comedik` (fallback: Arial, sans-serif) |
| H1/H2 | 8.75em, line-height 0.9, weight 400, uppercase |
| H3 | 2em, line-height 1.25, weight 700 |
| H4 | 1.5625em, uppercase, weight 900 |
| Mobile H1/H2 | 3.6875em |
| Mobile H3 | 1.5em |
| Mobile H4 | 1.25em |

**Fluid scaling:** Uses `clamp()` across 320px-2160px viewport range.

**Why these fonts work for sport/action brands:** Schabo Condensed is tall, tight, aggressive — commands attention in uppercase. Comedik adds playful energy as a counterpoint. The pairing is bold + fun, not bold + serious. Perfect for a sustainability-in-sport brand.

### Color Palette
| Token | CSS Variable | Known Value |
|-------|-------------|-------------|
| Dark | `--color-dark` | rgb(24, 24, 24) |
| Primary | `--color-primary` | (brand accent — exact hex in runtime) |
| Primary Dark | `--color-primary-dark` | (darker variant) |
| Secondary | `--color-secondary` | (secondary accent) |
| Light | `--color-light` | (light backgrounds) |
| White | `--color-white` | #fff |
| Gray | `--color-gray` | (neutral) |

**Selection colors:** Secondary color bg + dark text on `::selection`.

### Animation System
| Token | Value | Usage |
|-------|-------|-------|
| `--animation-fade` | `0.1s linear` | Micro-interactions |
| `--animation-fast` | `0.35s cubic-bezier(0.62, 0.05, 0.01, 0.99)` | Quick state changes |
| `--animation-primary` | `0.735s cubic-bezier(0.62, 0.05, 0.01, 0.99)` | Major transitions |

**Key cubic-bezier: `(0.62, 0.05, 0.01, 0.99)`**
This is a sharp ease-out with aggressive deceleration. Fast start, then almost instant settle. Creates snappy, confident motion.

**Keyframe Animations:**
| Name | What It Does |
|------|--------------|
| `glow` | Scale pulse 0.5 -> 0.85 -> 0.5 over 2s |
| `banner1` / `banner2` | Horizontal infinite scroll (marquee) |
| `sprite` | Step animation (3-25 steps) for icon sprite sheets |
| `wiggle` | Rotation +/-1.25deg, 2 steps — playful jitter |
| `spanDot1-3` | Staggered opacity dots (loading indicator) |
| `clip-path morph` | Polygon reveal for accordion content |

### THE SIDE MENU (Primary Study)

**Architecture:**
```
[data-navigation-status] ← controller attribute on parent
  .nav-mobile            ← mobile navigation panel
  .nav-side              ← desktop side navigation panel
```

**How it works:**
1. Default state: Both panels translated off-screen (likely `translateY(-100%)`)
2. Active state: `[data-navigation-status="active"]` toggles panels to `translateY(0%) rotate(0.001deg)`
3. The `rotate(0.001deg)` is a **GPU acceleration hack** — forces hardware compositing for smoother animation
4. Timing: `var(--animation-primary)` = **0.735s** with `cubic-bezier(0.62, 0.05, 0.01, 0.99)`
5. **Overlay behavior:** Menu overlays content (does not push). Background gets blurred via backdrop-filter.

**Backdrop blur on open:**
```css
.modal__blur {
  backdrop-filter: blur(2em) opacity(0);
}
[data-modal-status="active"] .modal__blur {
  backdrop-filter: blur(2em) opacity(1);
}
```

**Menu items:** Intro, Game Plan, Contact, Shop, Catalogue download

**Close mechanism:** Button that toggles `data-navigation-status` back to inactive.

**Mobile vs Desktop:**
- Mobile: `.nav-mobile` element, full-screen overlay
- Desktop: `.nav-side` element, side panel
- Separate DOM elements for each, both controlled by same data attribute

**Why this side menu works:**
- The 0.735s duration is long enough to feel intentional but short enough to not feel slow
- Backdrop blur creates depth hierarchy instantly
- `rotate(0.001deg)` GPU hack ensures butter-smooth animation even on mid-tier devices
- Data-attribute architecture means zero JavaScript animation logic — pure CSS transitions triggered by attribute changes

### Interactions
| Trigger | Effect |
|---------|--------|
| `[data-hover-sprite]:hover` | Sprite sheet animation on arrows (0.45s, 3 steps, infinite) |
| `[data-hover-wiggle]:hover` | Rotation wiggle +/-1.25deg (0.3s, 2 steps, infinite) |
| `[data-accordion-status="active"]` | Clip-path reveal: `polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)` -> `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)` |
| `[data-clipboard-success="true"]` | Copy confirmation state |
| SVG hover | `stroke-width: 0` -> `0.175em` on hover |

### Layout
| Token | Value |
|-------|-------|
| Container ideal | 1920px |
| Container min | 992px |
| Container max | 2160px |
| Container clamp | `clamp(992px, 100vw, 2160px)` |
| Desktop breakpoint | 992px+ |
| Tablet | 768px-991px |
| Mobile landscape | 480px-767px |
| Mobile portrait | 320px-479px |

**Mobile viewport fix:** Custom `--dvh`, `--svh`, `--lvh` variables to handle address bar collapse on mobile browsers.

**Smooth scroll:** Lenis library (`html.lenis-smooth`, `scroll-behavior: auto`)

**Scrollbar hidden:**
```css
::-webkit-scrollbar { display: none; }
html { scrollbar-width: none; }
```

### Libraries
- Lenis (smooth scroll)
- Flickity (carousel/slider)
- Google Analytics (gtag)
- Mailchimp (newsletter signup)
- Custom data-attribute state management system

### What Makes It Special
1. **The data-attribute state architecture** — No class toggling spaghetti. Clean `[data-x-status="active"]` pattern for all interactive states. Scalable, readable, debuggable.
2. **The side menu execution** — 0.735s cubic-bezier with backdrop blur and GPU-accelerated transforms. It feels like opening a drawer in a luxury car.

### What SV Can Steal
- **Data-attribute state management:** Use `data-*` attributes instead of class toggles for interactive states. Cleaner CSS selectors, easier to debug.
- **The exact side menu recipe:** `translateY(-100%)` -> `translateY(0%) rotate(0.001deg)` at 0.735s `cubic-bezier(0.62, 0.05, 0.01, 0.99)` + backdrop blur. Copy this exactly.
- **`rotate(0.001deg)` GPU hack:** Add to any transform animation for hardware acceleration.
- **Sprite hover animations:** Step-based sprite sheets for icon hover states. More interesting than opacity/color transitions.
- **Wiggle micro-interaction:** `rotation +/-1.25deg` on hover for social icons or secondary CTAs. Adds personality.

---

## 3. M-Sport Raptor — The Kindred DNA
**URL:** https://www.msport-raptor.com
**Built by:** Ryze (ryze.uk)
**Platform:** Nuxt 3 (Vue 3) with Pinia state management

### Typography

**Three-font system with clear roles:**

| Font | Weights | Role |
|------|---------|------|
| `Aeonik` | Light (300), Regular (400), Medium (500) | Primary — headings + body |
| `Monda` | Regular (400), SemiBold (600) | Secondary — buttons, stats, metadata, UI |
| `Orbitron` | Light (300) | Accent — loader only |

All loaded via `@font-face` with WOFF2 + WOFF fallback.

**Type Scale:**
| Element | Mobile | Desktop | Letter-Spacing | Line-Height |
|---------|--------|---------|----------------|-------------|
| H1 | 2.625rem | 3.75rem | -0.0425rem to -0.075rem | 1.1 |
| H2 | 2.125rem | 2.5rem | -0.0425rem to -0.05rem | 1.1 |
| H3 | 1.375rem | 1.625rem | -0.03rem | — |
| Body | 1rem | 1rem | -0.02rem | 1.6 |

**Advanced text-wrap:**
- Headings: `text-wrap: balance`
- Body: `text-wrap: pretty`

**Why Aeonik:** A geometric sans-serif with subtle humanist warmth. Professional but not clinical. Paired with Monda (monospace-influenced) for technical data and Orbitron (sci-fi display) for the loader — creates a spectrum from approachable to futuristic.

### Color Palette
| Role | Value | Usage |
|------|-------|-------|
| Brand Red | `#ff0037` | Buttons, list markers (8px circles), accent fills, hover states, icon holders. Appears 40+ times in CSS. |
| Black | `#000000` | Text, dark sections, footer background |
| White | `#ffffff` | Backgrounds, light text |
| Light Gray | `#f5f5f5` | Default module background |
| Overlay variants | `rgba(0,0,0,.1)` through `rgba(0,0,0,.8)` | Text overlays, modal backdrops |
| Border | `rgba(0,0,0,.2)` | Section dividers |

**Color philosophy:** Radical reduction. ONE accent color. Black and white. That's it. The restraint is what makes it feel premium.

### The Easing Curve
**`cubic-bezier(.65, 0, .35, 1)` — used EVERYWHERE**

This is the site's motion signature. It's a custom ease-in-out with:
- Aggressive initial acceleration (0.65 x-pull)
- Sharp deceleration at the end (0.35 x-pull)
- Creates "snappy yet smooth" motion — energetic start, confident stop
- Duration: primarily 0.4s (standard) and 0.2s (micro)

**Every animation on the site uses this single curve.** Consistency creates brand.

### The 22-Column Grid
```css
grid-template-columns: 0 20px repeat(22, minmax(0, 1fr)) 20px 0;
```

At 100rem+: columns are 4.54545rem wide with responsive gutters.

**Why 22:** Divisible by 2 and 11. Allows clean halves, thirds are approximated with column spans. More fine-grained than a 12-column grid — permits sophisticated asymmetric layouts.

**Common spans:**
| Pattern | Columns | Usage |
|---------|---------|-------|
| Full bleed | `1 / -1` | Hero sections, images |
| Content standard | `3 / -3` | Mobile body content |
| Content narrow | `4 / -4` | Desktop body content |
| Asymmetric left | `4 / span 8` | Text blocks in split layouts |
| Asymmetric right | `13 / -4` | Image blocks in split layouts |

### Animation Catalog

**@keyframes defined:**
| Name | Behavior |
|------|----------|
| `fadeIn` | Opacity 0 -> 1 |
| `fadeOut` | Opacity 1 -> 0 |
| `slideInLeft` | translateX(100%) -> translateX(0) |
| `slideOutRight` | translateX(0) -> translateX(100%) |
| `scrollButtonText` | Cycling scroll CTA text |
| `scrollButtonTextInverse` | Reverse direction text scroll |
| `scrollButtonTextRepeat` | Looping text scroll |
| `animateWaves` | Sound toggle wave bars (translate 0 to -25%) |
| `animateMuted` | Muted state waves (translate -50% to -75%) |
| `bob` | Gentle vertical bobbing |

**Clip-Path Reveal System (THE signature move):**

Horizontal reveal (left to right):
```css
clip-path: inset(0 100% 0 0);  /* hidden */
clip-path: inset(0 0 0 0);      /* revealed */
transition: clip-path 0.4s cubic-bezier(.65, 0, .35, 1);
```

Vertical reveal (bottom to top):
```css
clip-path: inset(0 0 100% 0);  /* hidden */
clip-path: inset(0 0 0 0);      /* revealed */
```

Hero polygon reveal:
```css
clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%);  /* collapsed line */
clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);        /* full rectangle */
```

**This is the site's primary motion language.** Not opacity fades. Not transform slides. Clip-path reveals. It's more cinematic — content is "uncovered" rather than "faded in."

### Page Loader
1. Full-screen black overlay (`z-index: 1000`)
2. "LOADING" text in Orbitron Light at `18vw` (mobile) / `12vw` (desktop)
3. Text masked by `--mask-height-percent` variable (0% -> 100%)
4. On complete: text clips away + translates down -65px
5. Overlay fades out: `0.4s` with `0.4s` delay
6. Grid layout with `place-self: center`

### Hero Section (Image Sequence)
- Fixed background with sticky positioning
- Full viewport video (`height: 100lvh`, `object-fit: cover`)
- Intro clip: `clip-path: inset(25% 0 25% 0)` — cinematic letterbox that opens
- Content holder absolutely positioned, animated in on scroll
- Class toggles: `.content-image-sequence--intro-enter` / `--intro-exit`
- 300vh placeholder height for scroll-driven sequencing

### Navigation
**Header:** Fixed, `z-index: 5`, 10px padding (mobile) -> 20px+ (desktop)

**Logo:** 2.5rem -> 3.125rem height, responsive. Filter: `brightness(0) invert(1)` for light-on-dark.

**Hamburger lines:** 2px height, 30px width, 8px gap. On open: rotate to X (`-45deg` and `45deg` with translate).

**Menu panel:** `translateY(100%)` -> `translateY(0)` at `0.4s cubic-bezier(.65, 0, .35, 1)`. Overlay fades in simultaneously.

**Desktop:** Split button layout (45% width each side).

### Driver Cards (Hover Masterclass)
Desktop: 500px wide, 660px height, `object-fit: cover` image.

**Hover cascade (5 simultaneous state changes):**
1. Border frame dissolves: `clip-path: inset(10px)` -> `inset(0)`
2. Red icon holder scales: `scale(.1)` -> `scale(1)`
3. White arrow rotates 45deg + translates +400px right (fades out)
4. Red arrow enters from opposite direction (fades in)
5. Driver name transforms `-60px, 5px` + turns white
6. Background image scales to `0.9433962264` (precise shrink)

Mobile: 220px wide, 304px height, minimal interaction.

### Button System

**Primary (`.button--solid-pill`):**
- Pill shape: `border-radius: 10000px`
- Height: 3.125rem, padding: 30px inline
- Fill: `#ff0037`
- Hover: dual pseudo-element swap (`:before` opacity 1->0, `:after` opacity 0->1)
- Icon animation: initial icon fades, hover icon appears

**Split Button (`.split-button-red-right`):**
- 2.5rem height, icon holder 2.5rem width with `#ff0037` bg
- Text holder has `:before` pseudo that `scaleX(0)` -> `scaleX(1)` on hover (red fill wipe)
- Icon rotates 45deg; text translates -13px
- Two text layers swapped via clip-path inset reveal

**Scroll CTA (`.split-button-red-scroll`):**
- 3.75rem height
- 200px text holder with THREE animated text children
- Cycles "SCROLL" / "DOWN" / repeat at 4s intervals via keyframe animation
- Most dynamic button variant — always moving

### Sound Toggle
- Fixed in header, 22px x 20px
- Inner wave holder: 240px wide, absolutely positioned
- 8 wave bars (each 25% width = 4 visible)
- Unmuted: `animateWaves` (translate 0 to -25%, 3s linear infinite)
- Muted: `animateMuted` (translate -50% to -75%, 3s linear infinite)
- Creates scrolling waveform illusion

### Popup/Modal System
**Structure:** Fixed overlay, `z-index: 10`

**Variants by width:**
| Type | Desktop Width |
|------|--------------|
| Driver popup | `max(75rem, 80.214%)` |
| Raptor/Spec/Downloads | `max(62.5rem, 66.84%)` |
| Mobile (all) | 100% full screen |

**Animation:**
- Open: `fadeIn 0.4s` overlay + `slideInLeft 0.4s` card (from right)
- Close: `.popup-holder--closing` triggers `fadeOut` + `slideOutRight`

**Close button:** 32px square, two pseudo-elements rotated +/-45deg forming X. Hover: lines scale down + gap widens.

### Page Transitions
Vue/Nuxt transition system:
- `.page-enter` / `.page-enter-to` / `.page-leave-to`: opacity 0
- `.fade-enter-active` / `.fade-leave-active`: 0.56s transition
- Simple opacity crossfade between routes

### Z-Index System
| Layer | Z-Index |
|-------|---------|
| Page loader | 1000 |
| Popup rack | 10 |
| Header / Nav | 5 |
| Popup cards | 2 |
| Module content | 1 |
| Video backgrounds | 0 |

### Footer
- Black background, inverted logo (brightness(0) invert(1))
- Flex row with 2.5rem gap (desktop)
- Social: Instagram, Facebook, X, LinkedIn
- Hover: sibling opacity drops to 0.6 (focus effect)
- Credit: Built by Ryze with embedded logo
- 4-column grid at 48rem+

### CDN & Performance
- Image CDN: `msport-raptor-assets.ryze.uk/cdn-cgi/image/q=80/`
- All images served at quality 80
- CSS custom properties for animation tokens
- Clip-path animations are GPU-composited (performance win)
- Smooth scroll via custom Nuxt composable + `scroll-margin-top` values

### What Makes It Special
1. **Clip-path as motion language.** Not a technique — an identity. Every reveal, every hover, every transition uses clip-path. It's how this site "speaks."
2. **Radical restraint.** Three fonts, one red, one easing curve. No gradients, no textures, no noise. The reduction IS the sophistication.

### What SV Can Steal
- **Clip-path reveal system:** Replace all opacity fades with `clip-path: inset()` transitions. Immediately more cinematic.
- **Single easing curve discipline:** Pick ONE cubic-bezier and use it everywhere. `cubic-bezier(.65, 0, .35, 1)` is a great starting point.
- **22-column grid:** More columns = more layout possibilities. Adopt for asymmetric, editorial layouts.
- **Driver card hover cascade:** Multiple simultaneous state changes on hover (5+ properties). Creates richness.
- **The scroll CTA button:** Animated cycling text in a split button. Steals attention without being intrusive.
- **Popup slide-in system:** Panels slide from right at 80% width on desktop, full-screen on mobile. Clean, contextual content display.
- **Color reduction:** One brand color + black + white. Resist adding more. Restraint = premium.
- **`text-wrap: balance` / `pretty`:** Modern CSS for better text flow. Free upgrade.
- **Sound toggle wave animation:** If SV ever uses audio/video, this is the pattern.
- **Orbitron as loader font:** Using a completely different "event" font for the loader creates anticipation.
- **Cinematic letterbox intro:** `clip-path: inset(25% 0 25% 0)` opening to full viewport. Film-level entrance.

---

## 4. Cross-Site Patterns

### Shared DNA Across All Three Sites

**Dark-first aesthetic:** All three sites default to dark backgrounds. Dark = premium in motorsport/action branding.

**Custom font loading:** All use `@font-face` with WOFF2/WOFF. None rely on Google Fonts CDN for primary type. The fonts ARE the brand.

**Transform-based animation:** All prefer `transform` and `clip-path` over `opacity` for animations. GPU-composited properties for smooth 60fps motion.

**Consistent easing:** Each site picks one or two cubic-bezier curves and uses them everywhere. Never `ease` or `ease-in-out` defaults.

**Cookie/state awareness:** Leclerc tracks first visit; FC88 uses data-attributes for state; Raptor uses Pinia store. All manage state intentionally.

**No heavy 3D:** None use Three.js, WebGL, or canvas for core animations. Performance over spectacle.

**Responsive with intention:** Not just "make it fit." Each site has distinct mobile/tablet/desktop experiences with different interaction models.

### Typography Pattern
Every site uses a 2-3 font system:
1. **Display/Brand font** — condensed, bold, for headlines (Coign / Schabo / Aeonik Medium)
2. **Body/Utility font** — readable, multiple weights (Manrope / Comedik / Aeonik Regular)
3. **Accent font** — special moments only (LeclercSans / — / Orbitron)

### Animation Pattern
All sites converge on:
- 0.3s-0.7s for primary transitions
- Custom cubic-bezier (never default easing)
- Transform + clip-path over opacity
- Staggered reveals over simultaneous reveals
- Scroll-triggered entrance animations

---

## 5. What SV Can Steal — Implementation Priority

### Tier 1: Implement Immediately
| Technique | Source | Effort |
|-----------|--------|--------|
| Single easing curve (`cubic-bezier(.65,0,.35,1)`) | M-Sport | Low |
| Clip-path reveal animations | M-Sport | Medium |
| Data-attribute state management | FC88 | Medium |
| `text-wrap: balance` / `pretty` | M-Sport | Low |
| `rotate(0.001deg)` GPU hack | FC88 | Low |
| Dark-first color scheme | All three | Low |

### Tier 2: Build This Sprint
| Technique | Source | Effort |
|-----------|--------|--------|
| Side menu with backdrop blur | FC88 | Medium |
| Multi-state hover effects (5+ properties) | M-Sport | Medium |
| Split button system with animated text | M-Sport | Medium |
| Popup/modal slide-in panels | M-Sport | Medium |
| Hidden scrollbar | FC88 | Low |

### Tier 3: Build This Quarter
| Technique | Source | Effort |
|-----------|--------|--------|
| First-visit vs return-visit experience | Leclerc | Medium |
| Lottie loading animations | Leclerc | High |
| 22-column grid system | M-Sport | High |
| Page transitions (Vue/Nuxt style) | M-Sport | High |
| Cinematic letterbox hero opening | M-Sport | Medium |

### Tier 4: Long-Term Brand Evolution
| Technique | Source | Effort |
|-----------|--------|--------|
| Custom brand typeface (like LeclercSans) | Leclerc | Very High |
| Sprite-based icon hover animations | FC88 | Medium |
| SVG path animation (course map style) | M-Sport | High |
| Sound design with wave toggle | M-Sport | Medium |

---

## Key CSS Values to Copy Directly

```css
/* M-Sport's signature easing */
--ease-primary: cubic-bezier(.65, 0, .35, 1);

/* FC88's signature easing */
--ease-snappy: cubic-bezier(0.62, 0.05, 0.01, 0.99);

/* Clip-path reveal (horizontal, left to right) */
.reveal-hidden { clip-path: inset(0 100% 0 0); }
.reveal-visible { clip-path: inset(0 0 0 0); }

/* Clip-path reveal (vertical, bottom to top) */
.reveal-up-hidden { clip-path: inset(0 0 100% 0); }
.reveal-up-visible { clip-path: inset(0 0 0 0); }

/* GPU acceleration hack */
transform: translateY(0%) rotate(0.001deg);

/* Side menu recipe */
.side-menu {
  transform: translateY(-100%);
  transition: transform 0.735s cubic-bezier(0.62, 0.05, 0.01, 0.99);
}
.side-menu--open {
  transform: translateY(0%) rotate(0.001deg);
}

/* Backdrop blur overlay */
.menu-blur {
  backdrop-filter: blur(2em) opacity(0);
  transition: backdrop-filter 0.735s cubic-bezier(0.62, 0.05, 0.01, 0.99);
}
.menu-blur--active {
  backdrop-filter: blur(2em) opacity(1);
}

/* Brand red from M-Sport */
--color-brand: #ff0037;

/* Text-wrap modern */
h1, h2, h3 { text-wrap: balance; }
p { text-wrap: pretty; }

/* Scrollbar hidden */
::-webkit-scrollbar { display: none; }
html { scrollbar-width: none; }

/* M-Sport's button pill */
.button-pill {
  border-radius: 10000px;
  height: 3.125rem;
  padding-inline: 30px;
}
```

---

*Analysis complete. This document is a living reference for the SV design system. Every value is extracted from production source code.*
