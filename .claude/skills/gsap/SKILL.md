---
name: gsap
description: Use for any scroll-triggered or timeline animation, staggered reveals, ScrollTrigger, or gsap.ticker work, especially together with Lenis smooth scroll in a Shopify theme. Gives pinned CDN URLs and the mandatory Lenis sync snippet.
---
# GSAP + ScrollTrigger
Source: greensock/GSAP (checked via npm gsap@3.12.5, released 2024-01-18; GitHub unreachable from the sandbox).

## Load (pinned, order matters, both `defer`)
```
https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js
```
Then `gsap.registerPlugin(ScrollTrigger)`.

## Mandatory Lenis sync
```js
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```
## Key API
`gsap.from/to/fromTo/set`, `gsap.timeline()`, `ScrollTrigger.create({trigger,start:'top 85%',once:true,onEnter})`, `ScrollTrigger.batch(els,{onEnter,start,once})`, `ScrollTrigger.refresh()`.

## Rules
Animate only transform, opacity, filter. Keep every existing color untouched. Reduced motion → no animation. Skip in theme editor (`Shopify.designMode`). Set initial states from JS, never hide with CSS before JS runs.
