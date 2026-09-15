# Cosmo Design System

Identidade visual premium do Cosmo Business AI.

## Estrutura

```
src/design/
├── tokens/          # Cores, spacing, radius, typography, glass, gradients
├── theme/           # ThemeProvider + ThemeEngine
├── animations/      # Presets Framer Motion
├── motion/          # Fade, Scale, Slide, Blur, Hover, Press, Loading
├── components/      # Card, Button, Input, Badge, Logo, Splash...
└── docs/            # Documentação
```

## Princípios

- **Premium dark-first** — background `#050816`
- **Glass + gradientes discretos** — profundidade sem ruído
- **Motion com propósito** — micro-interações, nunca distração
- **Acessibilidade** — `prefers-reduced-motion` respeitado
- **Performance** — logo com `will-change: transform`, animações CSS onde possível

## Uso rápido

```tsx
import { ThemeProvider, DesignCard, DesignButton, CosmoLogo } from "@/design";

<ThemeProvider>
  <DesignCard>
    <DesignButton variant="primary">Salvar</DesignButton>
  </DesignCard>
</ThemeProvider>
```

## Paleta

| Token | Valor |
|-------|-------|
| Background | `#050816` |
| Primary | `#2563EB` |
| Secondary | `#7C3AED` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |

## Componentes de shell

- **Sidebar** — rail 72px, ícones Lucide, indicador ativo com glow
- **Topbar** — pesquisa glass, avatar, desktop status, AI, notificações
- **Dashboard** — cards premium com gradiente e hover lift
- **Splash** — branding unificado web/desktop/mobile

Ver também: [TOKENS.md](./TOKENS.md), [COMPONENTS.md](./COMPONENTS.md), [ANIMATIONS.md](./ANIMATIONS.md).
