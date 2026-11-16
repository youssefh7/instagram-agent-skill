---
name: 21st-dev
description: Use for UI micro-interaction polish (button press feedback, card hover lift and glow, tilt, staggered card reveals) on a Shopify theme, taking 21st.dev components as interaction reference only.
---
# 21st.dev polish
Source: 21st.dev (component library, repo 21st-dev/magic-mcp). The site was not reachable from the sandbox; details below are the target spec, not copied code.

Components there are React + Tailwind + shadcn. Use only as reference for interaction details, rebuilt in the theme's own CSS/JS. Never install React, Tailwind or shadcn.

## Spec
- Buttons: `:active { transform: scale(.97) }`, transition 120ms `cubic-bezier(.16,1,.3,1)`.
- Product cards: soft stagger reveal (opacity + translateY 16px, 60ms stagger); hover lift (translateY -4px) and pointer-following glow via `--mx/--my` custom properties, glow color from existing theme variables (e.g. `rgb(var(--color-foreground-rgb) / var(--opacity-10))`).
- Gentle tilt only on `(hover:hover) and (pointer:fine)`.

## Rules
No new colors. Reduced motion → none. Skip in theme editor. Set initial states from JS.
