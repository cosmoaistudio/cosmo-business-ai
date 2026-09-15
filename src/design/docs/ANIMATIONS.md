# Animações

Base: **Framer Motion** + CSS (`design.css`).

## Presets (`animations/presets.ts`)

| Token | Valor |
|-------|-------|
| DURATION.fast | 0.2s |
| DURATION.normal | 0.35s |
| DURATION.logoSpin | 24s |
| EASING.smooth | cubic-bezier premium |

## Variants

- **fade** — opacity
- **scale** — entrada com scale 0.96
- **slideUp** — y: 16 → 0
- **slideRight** — x: -12 → 0
- **blur** — blur 8px → 0

## Motion components (`motion/index.tsx`)

| Componente | Efeito |
|------------|--------|
| `Fade` | Fade in/out |
| `Scale` | Scale in |
| `Slide` | Slide up |
| `Blur` | Blur reveal |
| `Hover` | Lift -4px |
| `Press` | Scale 0.97 |
| `LoadingMotion` | Pulse opacity |

## Logo

Classe `.cosmo-logo-3d`:

- Rotação contínua 24s linear
- `transform-style: preserve-3d`
- Glow `--cosmo-shadow-glow`
- Desativado em `prefers-reduced-motion`

## Cards

`.cosmo-premium-card:hover` — border glow + shadow azul suave.

## Botões

Ripple via `useRipple` + classe `.cosmo-ripple`.
