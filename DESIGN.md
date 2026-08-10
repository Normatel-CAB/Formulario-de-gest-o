# Design System Normatel — neste app

Este app usa o mesmo design system do `organograma-macae-normatel`. Aquele
projeto é Next.js 14 + Tailwind v3 (tokens em `tailwind.config.ts`); aqui é Vite
+ Tailwind v4, então os tokens vivem em `src/index.css` — os **nomes são os
mesmos**, e componentes escritos com eles têm a mesma aparência nos dois apps.

## 1. Regra de ouro

**Nunca escreva cor literal em componente.** Toda cor sai de um token. Se você
está prestes a digitar `#4caf50`, `text-emerald-600`, `bg-white` ou
`text-gray-500`, pare — existe um token para isso.

| Em vez de | Use |
| --- | --- |
| `rounded-2xl border border-border bg-surface shadow` | `<Card>` (já é vidro) |
| `text-gray-500` | `text-txt-dim` (secundário) ou `text-txt-faint` (terciário) |
| `text-emerald-600`, `text-green-500` | `text-brand-lite` / `text-viz-lime` |
| `text-amber-600` | `text-viz-amber` |
| `text-red-600`, `text-rose-400` | `text-viz-red` |
| `border-gray-200` | `border-hairline` |
| `bg-gray-50`, `bg-white/10` | `bg-surface-2` |

## 2. Tokens

Definidos em `src/index.css`, em dois blocos: `:root` (claro) e `.dark`
(escuro). O bloco `@theme inline` os expõe ao Tailwind — como é `inline`, a
utilitária emite `var(--txt-dim)` direto, e por isso a troca de tema funciona
sem recompilar nada.

**Cores**

- `brand`, `brand-lite`, `brand-glow`, `brand-deep` — identidade Normatel
- `viz-green`, `viz-lime`, `viz-teal`, `viz-amber`, `viz-red` — dados
- `surface`, `surface-2`, `surface-solid` — superfícies
- `hairline`, `hairline-hi` — bordas (normal e em destaque/hover)
- `txt`, `txt-dim`, `txt-faint` — hierarquia de texto

**Sombras**: `shadow-glass`, `shadow-brand-sm`, `shadow-brand-md`
**Easing**: `ease-smooth` (`cubic-bezier(.22,.75,.28,1)`) — o padrão do sistema
**Animações**: `animate-shimmer`, `animate-brand-pulse`, `animate-orb-drift`,
`animate-slow-spin`, `animate-sheen`

**Classes de componente**: `.glass`, `.glass-hover`, `.chip`, `.row-bar`,
`.tabular`, `.grid-spotlight`, `.glow-btn`

### Apelidos de compatibilidade

As telas mais antigas foram escritas com `ink` / `border` / `surface-3` e com a
escala `brand-50..950`. Esses nomes continuam válidos e apontam para os tokens
novos (`--color-ink: var(--txt)` etc). Foi essa ponte que permitiu migrar a
paleta inteira sem reescrever as ~4 mil linhas de telas. **Em código novo, use
os nomes canônicos** (`txt`, `hairline`, `surface-2`).

## 3. Componentes

| Componente | Arquivo | Para quê |
| --- | --- | --- |
| `Card` | `ui/Card.tsx` | Cartão de vidro. `flat` remove o hover. |
| `Button` | `ui/Button.tsx` | Variantes primary/outline/secondary/ghost/danger/link |
| `GlowButton` | `ui/GlowButton.tsx` | Botão magnético com brilho (usado nos logins) |
| `Reveal` | `ui/Reveal.tsx` | Entrada em cascata (`index` escalona) |
| `Input`/`Select`/`Textarea` | `ui/Field.tsx` | Campos com rótulo em caixa alta |
| `Stepper` | `ui/Stepper.tsx` | Etapas do formulário |
| `AppBackground` | `layout/AppBackground.tsx` | Halos + grade + orbes + holofote |
| `GridSpotlight` | `layout/GridSpotlight.tsx` | Grade que acende no cursor |
| `ThemeProvider` / `ThemeToggle` | `theme/` | Tema claro/escuro |

## 4. Padrões de página

```tsx
<div className="space-y-5">
  <Reveal index={0}>{/* chip + h1 + subtítulo */}</Reveal>
  <Reveal index={1}><Card>…</Card></Reveal>
</div>
```

Tipografia: título `text-[27px] font-bold tracking-[-0.025em]`, subtítulo
`text-[13px] text-txt-dim`, corpo `text-[12.5px]`, rótulo
`text-[10px] uppercase tracking-[0.1em] text-txt-faint`.

Números sempre com `.tabular` para não dançarem ao atualizar.

## 5. Performance (as mesmas armadilhas do organograma)

- **Sem `backdrop-filter` nos cards.** Eles ficam sobre um fundo estático, então
  o blur é imperceptível — mas o navegador reborraria o fundo de cada card a
  cada frame do scroll. O blur fica só na sidebar e no header, onde algo
  realmente passa por baixo.
- **Orbes do fundo são estáticos.** Um círculo de 460px com `blur(90px)` animado
  em loop mantém o compositor ocupado permanentemente.
- **Holofote da grade** move só um quadrado de 460px via `transform`, dentro de
  `requestAnimationFrame`, e desliga em telas de toque.

## 6. Acessibilidade e movimento

Toda animação passa por `useEntranceMotion()` (`lib/motion.ts`) ou pela media
query `prefers-reduced-motion` já declarada no `index.css`. Ao criar animação
nova, respeite o mesmo contrato.

Contraste: `txt-faint` é o limite inferior aceitável e só serve para rótulos
auxiliares. Dado que a pessoa precisa ler nunca fica em `txt-faint`.
