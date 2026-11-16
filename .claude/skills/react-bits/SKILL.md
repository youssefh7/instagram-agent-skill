---
name: react-bits
description: Use when the user wants a React Bits effect (BlurText, SplitText, etc.) on a Liquid/Shopify theme. React Bits is React; this skill explains how to rebuild the effect in vanilla JS + GSAP without adding React.
---
# React Bits → vanilla
Source: DavidHDev/react-bits. NOTE: the repo could not be cloned in the sandbox (403); BlurText below is rebuilt from knowledge of the component, not from a fresh read. Re-check `src/content/TextAnimations/BlurText` when GitHub is reachable.

## BlurText behaviour
Text split into units; each unit animates from `{filter:blur(10px), opacity:0, y:-50}` through `{blur(5px), opacity:.5, y:5}` to `{blur(0), opacity:1, y:0}`, ~0.35s per step, ~0.2s stagger, triggered by IntersectionObserver (threshold 0.1) once.

## Shopify rules
- Never add React. Rebuild with vanilla JS + GSAP.
- Split by WORDS only (letter-splitting breaks Arabic joining). Keep the real text in `aria-label` and mark spans `aria-hidden`.
- Animate only transform, opacity, filter. No color changes. Respect reduced motion and `Shopify.designMode`.
