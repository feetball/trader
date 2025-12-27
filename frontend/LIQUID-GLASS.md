# Liquid Glass Design Specification (iOS-inspired)

This dashboard uses an **iOS-inspired Liquid Glass** visual language: translucent “vibrant” surfaces, soft inner highlights, subtle strokes, and depth via blur + shadow.

## Core principles

1. **Translucency over opacity**: prefer blurred glass panels over solid backgrounds.
2. **Vibrancy**: apply blur + saturation to foreground surfaces so background colors subtly bleed through.
3. **Depth**: use soft shadows and layered surfaces; avoid heavy borders.
4. **Strokes + inner highlights**: thin outer stroke plus a faint inner highlight to mimic iOS glass.
5. **Restraint**: animation is minimal; motion is subtle and disabled for `prefers-reduced-motion`.

## Design tokens

Implemented as CSS variables in `frontend/src/styles/globals.css`.

- **Blur**: `--lg-blur`, `--lg-blur-subtle`
- **Surfaces**: `--lg-surface`, `--lg-surface-strong`, `--lg-surface-subtle`
- **Strokes**: `--lg-stroke`, `--lg-stroke-strong`
- **Highlights**: `--lg-highlight`, `--lg-highlight-strong`
- **Shadows**: `--lg-shadow-soft`, `--lg-shadow-medium`

## Surface classes

These are the canonical building blocks. Use these instead of `bg-surface*` where possible.

- `.glass`: primary glass surface (cards, app bar, sidebar)
- `.glass-light`: secondary glass surface (sub-panels inside cards)
- `.lg-panel`: layout-level panel (page wrappers)
- `.lg-input`: inputs/selects/textareas with glass styling

## Usage rules

- **App chrome** (sidebar, app bar) must use `.glass`.
- **Cards/panels** must use `.glass` or `.glass-light` (never flat solid fills).
- **Tables/log panes** use `.glass-light` and `.custom-scrollbar`.
- **Modals/dialogs** use `.glass` + stronger stroke.
- **Hover**: only small elevation/stroke changes; no big scale-jumps.

## Accessibility

- Maintain readable contrast on text.
- Keep focus rings visible.
- Respect `prefers-reduced-motion`.
