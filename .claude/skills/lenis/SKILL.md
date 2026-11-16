---
name: lenis
description: Use whenever adding smooth/inertial scrolling to a site or Shopify theme, or when scroll feels jumpy, when wiring scrollTo/anchor links, or when a drawer/modal/menu must still scroll while Lenis is active. Covers Lenis 1.1.20 via CDN, required CSS, data-lenis-prevent, stop/start, and GSAP sync.
---
# Lenis (smooth scroll)
Source: darkroomengineering/lenis (docs verified from the npm package lenis@1.1.20; GitHub was not reachable from the sandbox).

## Load (pinned, released 2025-01-20)
`<script defer src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js"></script>` exposes global `Lenis`.

## Required CSS
```css
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-stopped { overflow: hidden; }
```
## Key API
`const lenis = new Lenis({ lerp: 0.1, autoRaf: false, anchors: false })` · `lenis.raf(timeMs)` · `lenis.on('scroll', fn)` · `lenis.scrollTo(target|px, {offset, duration, immediate, lock, onComplete})` · `lenis.stop()` / `lenis.start()` · `lenis.destroy()` · `lenis.resize()`.
Touch devices stay native by default (`syncTouch:false`) — keep it that way on phones.

## Shopify rules
- Expose as `window.sniffLenis`. Programmatic scrolls go through `lenis.scrollTo`.
- Any element that scrolls on its own (cart drawer, mobile menu, predictive search, modal/dialog panels, `overflow:auto` lists) gets `data-lenis-prevent`.
- `lenis.stop()` when a drawer/dialog opens, `lenis.start()` when it closes.
