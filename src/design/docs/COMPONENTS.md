# Componentes do Design System

## Layout & Brand

| Componente | Descrição |
|------------|-----------|
| `CosmoLogo` | Logo "C" com rotação 360° suave, glow azul, hover 3D |
| `CosmoSplash` | Splash screen animada (web) |

## Superfícies

| Componente | Descrição |
|------------|-----------|
| `DesignCard` | Card premium glass com hover lift |
| `DesignEmptyState` | Estado vazio com ícone e ação |
| `DesignLoading` | Spinner + label |

## Inputs & Actions

| Componente | Descrição |
|------------|-----------|
| `DesignButton` | primary/secondary/ghost/danger + ripple |
| `DesignInput` | Input dark glass |
| `DesignChip` | Filtros selecionáveis |
| `DesignBadge` | Status tags |
| `DesignAvatar` | Avatar com gradiente |
| `DesignTooltip` | Tooltip CSS hover |

## Overlays

| Componente | Descrição |
|------------|-----------|
| `DesignModal` | Re-export do Dialog shadcn |
| `DesignDrawer` | Re-export do Sheet shadcn |
| `designToast` | Re-export Sonner |

## Shell atualizado (fora de `design/`)

- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Topbar.tsx`
- `src/components/layout/AppLayout.tsx`

## Dashboard

- `DashboardMetricCard` usa `cosmo-premium-card`
- Tipografia clara sobre fundo `#050816`
