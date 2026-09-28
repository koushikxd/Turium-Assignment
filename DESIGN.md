---
name: Turium
description: >-
  Design system for apps/web, extracted from apps/web/src/index.css, the
  apps/web/src/components/ui primitives, and the product surfaces (chat, chats, projects, crons, memory,
  knowledge base). Values are written "light → dark" where the two themes differ. The
  /admin and /settings routes were out of scope for this pass and may deviate.
colors:
  # Theme tokens. Achromatic (chroma 0) shadcn/base-ui palette; oklch is the literal in
  # the source. Binding: bg-<name> / text-<name> / border-<name>, or var(--<name>).
  background: "oklch(0.979 0 0) → oklch(0.182 0 0)" # #f8f8f8 → #121212
  foreground: "oklch(0.145 0 0) → oklch(0.985 0 0)"
  card: "oklch(1 0 0) → oklch(0.205 0 0)"
  card-foreground: "oklch(0.145 0 0) → oklch(0.985 0 0)"
  popover: "oklch(1 0 0) → oklch(0.205 0 0)"
  popover-foreground: "oklch(0.145 0 0) → oklch(0.985 0 0)"
  primary: "oklch(0.205 0 0) → oklch(0.87 0 0)"
  primary-foreground: "oklch(0.985 0 0) → oklch(0.205 0 0)"
  secondary: "oklch(0.97 0 0) → oklch(0.269 0 0)"
  secondary-foreground: "oklch(0.205 0 0) → oklch(0.985 0 0)"
  muted: "oklch(0.97 0 0) → oklch(0.269 0 0)"
  muted-foreground: "oklch(0.556 0 0) → oklch(0.708 0 0)"
  accent: "oklch(0.964 0 0) → oklch(0.252 0 0)" # #f3f3f3 → #222, the hover tint
  accent-foreground: "oklch(0.205 0 0) → oklch(0.985 0 0)"
  destructive: "oklch(0.58 0.22 27) → oklch(0.704 0.191 22.216)"
  border: "oklch(0.922 0 0) → oklch(1 0 0 / 10%)"
  input: "oklch(0.922 0 0) → oklch(1 0 0 / 15%)"
  ring: "oklch(0.708 0 0) → oklch(0.556 0 0)"
  sidebar: "oklch(1 0 0) → oklch(0.209 0 0)" # #fff → #181818
  sidebar-foreground: "oklch(0.145 0 0) → oklch(0.985 0 0)"
  sidebar-primary: "oklch(0.205 0 0) → oklch(0.488 0.243 264.376)"
  sidebar-primary-foreground: "oklch(0.985 0 0) → oklch(0.985 0 0)"
  sidebar-accent: "oklch(0.964 0 0) → oklch(0.252 0 0)"
  sidebar-accent-foreground: "oklch(0.205 0 0) → oklch(0.985 0 0)"
  sidebar-border: "oklch(0.922 0 0) → oklch(1 0 0 / 10%)"
  sidebar-ring: "oklch(0.708 0 0) → oklch(0.556 0 0)"
  chart-1: "oklch(0.809 0.105 251.813)" # chart-* are a blue ramp, charts only
  chart-2: "oklch(0.623 0.214 259.815)"
  chart-3: "oklch(0.546 0.245 262.881)"
  chart-4: "oklch(0.488 0.243 264.376)"
  chart-5: "oklch(0.424 0.199 265.638)"
  # --- Off-theme colour. Deliberate, but NOT theme tokens: these are Tailwind palette
  # utilities and literals, so they do not respond to the theme. See Colors.
  # 1. The addressing accent: mentions, replies, read receipts, your own reaction.
  sky-500: "oklch(68.5% 0.169 237.323)" # bg-sky-500/15, border-sky-500, text-sky-500
  sky-700: "oklch(50% 0.134 242.749)" # text-sky-700, light theme
  sky-300: "oklch(82.8% 0.111 230.318)" # dark:text-sky-300
  # 2. Identity orbs. ORB_COLORS in user-avatar.tsx, indexed by a hash of the identity.
  orb-1: "#1a73f2"
  orb-2: "#4f46e5"
  orb-3: "#7c3aed"
  orb-4: "#9333ea"
  orb-5: "#db2777"
  orb-6: "#e11d48"
  orb-7: "#ea580c"
  orb-8: "#d97706"
  orb-9: "#16a34a"
  orb-10: "#0d9488"
  orb-11: "#0891b2"
  orb-12: "#65a30d"
  # 3. Knowledge-base file kinds (file-glyph.tsx) and index status (kb-status.tsx). Always
  # a /10 plate under a 600/dark:400 glyph; the hue is the file's category, never a state.
  glyph-pdf: "oklch(63.7% 0.237 25.331)" # bg-red-500/10 text-red-600 dark:text-red-400
  glyph-image: "oklch(62.7% 0.265 303.9)" # purple-500
  glyph-doc: "oklch(62.3% 0.214 259.815)" # blue-500
  glyph-sheet: "oklch(69.6% 0.17 162.48)" # emerald-500
  glyph-slides: "oklch(70.5% 0.213 47.604)" # orange-500
  glyph-code: "oklch(71.5% 0.143 215.221)" # cyan-500
  glyph-archive: "oklch(76.9% 0.188 70.08)" # amber-500
  glyph-text: "oklch(55.4% 0.046 257.417)" # slate-500
  status-indexing: "oklch(76.9% 0.188 70.08)" # amber-500, in progress
  status-queued: "oklch(79.5% 0.184 86.047)" # yellow-500, waiting
  status-indexed: "oklch(69.6% 0.17 162.48)" # emerald-500, the one green in the product
typography:
  # fontFamily is {typography.font-sans} everywhere except mono-12.
  hero-24: { fontSize: 24px, fontWeight: 600, lineHeight: 32px, letterSpacing: -0.025em } # text-2xl font-semibold tracking-tight
  title-18: { fontSize: 18px, fontWeight: 600, lineHeight: 28px } # text-lg font-semibold
  label-14: { fontSize: 14px, fontWeight: 500, lineHeight: 20px } # text-sm font-medium
  body-14: { fontSize: 14px, fontWeight: 400, lineHeight: 20px } # text-sm, the <body> default
  prose-16: { fontSize: 16px, fontWeight: 400, lineHeight: 24px } # text-base, chat bubbles and composer
  prose-heading-16: { fontSize: 16px, fontWeight: 600, lineHeight: 24px } # every h1-h6 inside an assistant answer
  meta-12: { fontSize: 12px, fontWeight: 400, lineHeight: 16px } # text-xs
  meta-12-medium: { fontSize: 12px, fontWeight: 500, lineHeight: 16px } # text-xs font-medium
  card-12-relaxed: { fontSize: 12px, fontWeight: 400, lineHeight: 19.5px } # text-xs/relaxed
  # The chat surface runs a finer scale than the Tailwind steps. Untokenized arbitrary
  # values; chat only. text-[13px] has no token equivalent, so it is a real gap. These set
  # font-size only, so lineHeight is whatever the site inherits or names separately.
  chat-13: { fontSize: 13px, fontWeight: 400 } # text-[13px], thinking-trace rows, source titles
  chat-13-semibold: { fontSize: 13px, fontWeight: 600 } # text-[13px] font-semibold, day divider
  chat-12-medium: { fontSize: 12px, fontWeight: 500 } # text-[12px] font-medium, message timestamps
  chat-11: { fontSize: 11px, fontWeight: 500 } # text-[11px], read-receipt count, citation pill, tile caption
  chat-10: { fontSize: 10px, fontWeight: 600, lineHeight: 1 } # text-[10px] leading-none, role badge, metric label
  mono-12: {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 12px,
      fontWeight: 400,
      lineHeight: 16px,
    } # font-mono text-xs, Tailwind's default stack (not overridden; there is no --font-mono)
  font-sans: "-apple-system-body, ui-sans-serif, -apple-system, system-ui, 'Segoe UI', Helvetica, 'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol'"
rounded:
  base: 10px # --radius: 0.625rem
  sm: 6px # calc(var(--radius) - 4px)
  md: 8px # calc(var(--radius) - 2px), the primitive default
  lg: 10px # var(--radius)
  xl: 14px # calc(var(--radius) + 4px), the dominant product radius
  2xl: 18px # calc(var(--radius) + 8px)
  3xl: 22px # calc(var(--radius) + 12px)
  4xl: 26px # calc(var(--radius) + 16px), defined but unused in scope
  full: 9999px
spacing:
  base: 4px # --spacing, Tailwind v4 default; every step is a multiple, halves included
  1: 4px
  2: 8px # the default inline gap
  2.5: 10px # the control-cluster gap
  3: 12px
  4: 16px
  5: 20px # the default gap between page sections
  6: 24px # the page padding, and the transcript gap between exchanges
components:
  # Import the real primitives from @/components/ui; these entries only fix the defaults.
  button-default:
    height: 32px # h-8; xs 24, sm 28, lg 36; icon-xs 24, icon-sm 28, icon 32, icon-lg 36
    rounded: "{rounded.md}"
    paddingInline: 10px # px-2.5
    typography: "{typography.label-14}"
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    hover: { backgroundColor: "{colors.primary} at 80%" }
    active: { transform: translateY(1px) } # suppressed on aria-haspopup triggers
    focus: { border: "{colors.ring}", ring: "1px {colors.ring} at 50%" }
    disabled: { opacity: 0.5, pointerEvents: none }
  input:
    height: 32px
    rounded: "{rounded.md}"
    paddingInline: 10px
    border: "{colors.input}"
    backgroundColor: transparent
    typography: "{typography.body-14}"
    focus: { border: "{colors.ring}", ring: "1px {colors.ring} at 50%" }
    disabled: { backgroundColor: "{colors.input} at 50%", opacity: 0.5 }
  card:
    rounded: "{rounded.md}"
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    ring: "1px {colors.foreground} at 10%"
    padding: "{spacing.4}" # --card-spacing; 12px at size="sm"
    typography: "{typography.card-12-relaxed}"
  badge:
    height: 20px
    rounded: "{rounded.md}"
    paddingInline: "{spacing.2}"
    typography: "{typography.meta-12-medium}"
  dialog:
    rounded: "{rounded.2xl}"
    backgroundColor: "{colors.popover}"
    ring: "1px {colors.foreground} at 10%"
    padding: "{spacing.6}"
    gap: "{spacing.5}"
    maxWidth: 384px # sm:max-w-sm
    overlay: "black at 10% + backdrop-blur-xs"
  bubble:
    rounded: "{rounded.md}" # BubbleContent; the chat surface overrides to {rounded.lg}
    paddingInline: 10px
    paddingBlock: "{spacing.2}"
    maxWidth: "80%"
    typography: "{typography.meta-12}" # overridden to {typography.prose-16} in chat
  composer:
    rounded: "{rounded.3xl}"
    backgroundColor: "{colors.background} → {colors.sidebar}"
    border: "{colors.input}"
    typography: "{typography.prose-16}"
    maxWidth: 768px # max-w-3xl, shared with the transcript
# --- extensions (not spec groups) ---
shadows:
  # Depth is carried by rings and borders, not shadows. These are the only real uses.
  toast: "shadow-lg" # also the command palette, sheet, lightbox, hover preview
  menu: "shadow-md" # dropdown-menu, popover, select, hover-card
  ring: "0 0 0 1px oklch(0.145 0 0 / 0.1)" # ring-1 ring-foreground/10, the elevated-surface edge
  hairline-outline: "0 0 0 1px oklch(0 0 0 / 0.1)" # outline-black/10 dark:outline-white/10, on photos only
motion:
  fast: 150ms # the most common duration in the product
  base: 200ms
  slow: 300ms
  entrance: 500ms # the animate-in entrance for pages, rows, and heroes
  panel-push: 220ms # sidebar nested panel slide
  overlay-in: 180ms
  overlay-out: 130ms # out is always faster than in
  scroll-button-in: 200ms
  scroll-button-out: 400ms
  toast-stack: 500ms
  shimmer: 2.5s
  easing: "ease-out" # cubic-bezier(0, 0, 0.2, 1), the default in TSX
  easing-house: "cubic-bezier(0.23,1,0.32,1)" # easeOutQuint, the globals.css keyframe easing
  easing-panel: "cubic-bezier(0.32,0.72,0,1)"
  easing-overlay-in: "cubic-bezier(0.165,0.84,0.44,1)"
  easing-overlay-out: "cubic-bezier(0.4,0,1,1)"
  easing-toast: "cubic-bezier(0.22,1,0.36,1)"
  cascade-base: 130ms # first row
  cascade-step: 45ms # per row, capped at 8 rows
  skeleton-delay: 500ms
  tooltip-open-delay: 400ms
  search-debounce: 180ms # 150ms in the command palette
breakpoints:
  sm: 640px
  md: 768px # also the JS sidebar/mobile breakpoint
  lg: 1024px
---

# Turium design system

## Overview

Quiet, flat, and dense in the way a tool you keep open all day has to be. The chrome is
achromatic: greys from `oklch(0.979)` down to `oklch(0.145)`, one red for danger, and no
webfont, so nothing competes with the work. Depth comes from a hairline
`ring-1 ring-foreground/10` on floating surfaces and `border-border` everywhere else, so
screens read as sheets of paper on a light grey desk. Text is small by default (14px body,
12px metadata) and the chat transcript is the one place that opens up to 16px prose and a
24px vertical rhythm.

Colour is reserved and load-bearing where it appears: a `sky` accent for anything
addressed at a person (mentions, replies, read receipts, your own reaction), a categorical
hue per knowledge-base file kind, amber/yellow/emerald for index status, and saturated
generated faces for identity. Everything else is grey. If a new surface wants colour, the
answer is almost always no.

This file documents both themes; light and dark are the same tokens with different values,
so writing tokens gets dark mode for free. Everything here comes from
`apps/web/src/index.css`, the `apps/web/src/components/ui` primitives, and the product
surfaces under `apps/web/src`. The off-theme colour families in the frontmatter are
Tailwind palette utilities and literals, not tokens, and are annotated as such. The
`/admin` and `/settings` routes were excluded from this pass.

## Consumption

Tailwind v4, no `tailwind.config`. Tokens are CSS custom properties in
`apps/web/src/index.css`: raw values in `:root` and `.dark`, exposed as
utilities through the `@theme inline` block. So each token has exactly one binding:

- Colors: `bg-background`, `text-muted-foreground`, `border-border`, `ring-ring`. Reach
  for `var(--sidebar-border)` only inside an arbitrary value that needs it.
- Radii: `rounded-md`, `rounded-xl`. They resolve through `--radius`, so never write
  `rounded-[10px]`.
- Opacity modifiers are the house way to derive a shade: `bg-muted/40`,
  `bg-destructive/5`, `ring-foreground/10`, `text-sidebar-foreground/60`. Do not add a new
  colour token for a tint.
- Fonts: `font-sans` (already set on `html` and `body`), `font-mono` for code and raw
  text. There is no `--font-mono` token and no webfont.

`@layer base` sets more than you might expect, so don't restate it: `body` is
`font-sans text-sm font-normal bg-background text-foreground`, `html` is antialiased, `*`
gets `border-border outline-ring/50`, and **scrollbars are hidden globally**
(`scrollbar-width: none` plus a `::-webkit-scrollbar` reset). A scroll region needs its
own affordance, which is why `scroll-fade-b` and the scroll-to-bottom button exist.

Shared primitives live in `apps/web/src/components/ui` and import one per file:
`import { Button } from "@/components/ui/button"`. The same for `card`, `input`,
`textarea`, `badge`, `dialog`, `alert-dialog`, `dropdown-menu`, `popover`, `select`,
`tabs`, `table`, `pagination`, `empty`, `skeleton`, `spinner`, `tooltip`, `sidebar`,
`sheet`, `input-group`, `native-select`, `command`, `kbd`, `avatar`, `attachment`, `item`,
`marker`, `bubble`, `message`, `message-scroller`. Class merging is `cn` from
`@/lib/utils`, which re-exports the `cn` package (not `clsx` + `tailwind-merge`),
so conflicting utilities are **not** reliably deduped by later-wins order. Build a
primitive from scratch only if `apps/web/src/components/ui` has no equivalent.

Most primitives are Base UI (`@base-ui/react`); the command palette is `cmdk`, the
transcript scroller is `@shadcn/react`, markdown is `streamdown`, and the emoji picker is
`frimousse`. Spring and layout animation is `motion` (`motion/react`), used in
`nav-connectors`, `nav-projects`, `upload-dialog`, `file-preview`, `composer-connectors`,
`command`, and `toast`. CSS-first for anything that can be CSS; `motion` when the value is
measured (height, position) or wants a spring.

Extra utility families come from `@import "shadcn/tailwind.css"` and need no setup:
`shimmer` / `shimmer-duration-*` (text shimmer, reduced-motion aware), `scroll-fade-b` /
`scroll-fade-x` (masked scroll edges, scroll-driven), `no-scrollbar`, and the
`data-open:` / `data-closed:` / `data-active:` / `data-selected:` / `data-disabled:`
variants the Base UI primitives are styled with. Turium's own `@utility` set lives in
`globals.css`: `animate-shimmer`, `animate-reveal`, `animate-reaction`, `animate-metric`,
`animate-link-preview`, each with a `prefers-reduced-motion` branch built in.

Icons are Hugeicons, always the same two-part import:

```tsx
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

<HugeiconsIcon icon={Search01Icon} className="size-3.5" />;
```

`size-3.5` (14px) is the inline icon in product screens; primitives default their own
icons to `size-4`, and sidebar menu buttons force `size-4` on any child svg. Never
introduce a second icon set.

Reach for the binding, never the literal. The sanctioned exceptions are listed in Colors;
everything else is debt (see Do's and Don'ts).

## Colors

The scale is semantic, not numeric. What each token is for:

- `background` is the page; `card` and `popover` are the surfaces that sit on it. In light
  mode the page is grey (`#f8f8f8`) and surfaces are white, so a card lifts without a
  shadow. In dark mode that inverts: the page is `#121212` and surfaces are lighter.
- `foreground` is body text. `muted-foreground` is every piece of secondary text:
  timestamps, counts, descriptions, placeholders, the label under a row title. If text is
  not the primary thing on its line, it is `text-muted-foreground text-xs`.
- `muted` is a fill, `muted-foreground` is text; they are not a pair. Row and list hover
  is `hover:bg-muted/40`, the icon tile in an empty state and the palette row tile are
  `bg-muted`.
- `accent` is the hover tint for sidebar and header affordances (`hover:bg-accent`), the
  selected state in a menu or mention list, and, at `/20` through `/60`, the resting
  fill of a soft card (project kind tiles, staged upload rows, knowledge-base search
  hits). `bg-accent/35` is the house "soft card" fill.
- `primary` is near-black in light and near-white in dark: the default button, the top
  progress bar, the "working" status dot, the drop-target border, a file mention chip.
  Hover is `hover:bg-primary/80`.
- `secondary` is the low-emphasis fill (secondary buttons, the "Archived" badge, the
  scroll-to-bottom button's variant).
- `destructive` signals danger, not merely error. Destructive buttons and badges are
  `bg-destructive/10 text-destructive`, never solid red. Error text is
  `text-xs text-destructive`; the inline error block is
  `rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive`.
  There is no success, warning, or info token in the theme.
- `border` is every hairline. `input` is the border on form controls (a different alpha in
  dark). `ring` is focus only.
- The `sidebar-*` set exists so the rail can be a different tone from the page: white
  against grey in light, `#181818` against `#121212` in dark. Inside the sidebar use the
  `sidebar-*` tokens, and derive its quieter text with `text-sidebar-foreground/60` and
  `/45` rather than reaching for `muted-foreground`.
- `chart-1` … `chart-5` are a blue ramp used only by `@/components/ui/chart`.

Four colour families sit deliberately **outside** the theme. They are Tailwind palette
utilities or literals, so they do not respond to light/dark beyond the `dark:` variants
written at each site. Use them only for the meaning they already carry:

1. **The addressing accent, `sky`.** Anything aimed at a specific person: a mention chip
   (`bg-sky-500/15 text-sky-700 dark:text-sky-300`), a reply quote's left rule
   (`border-l-2 border-sky-500`) and author (`text-sky-700 dark:text-sky-300`), a fully
   read receipt (`text-sky-500`), your own reaction (`bg-sky-500/15 hover:bg-sky-500/25`),
   and the jump-to-message flash (`animate-reveal`, which mixes `--color-sky-500` at 24%).
   This is the only hue in the conversation surface. It wants to be a token and is not
   one yet; if you add a fifth site, promote it rather than copying `sky-*` again.
2. **Identity orbs.** The twelve `ORB_COLORS` in
   `apps/web/src/components/shell/user-avatar.tsx` tint a `FluidOrb`, one colour and one
   noise pattern per identity, both drawn from a hash of the identity string. They are
   kept off-theme so people read as people and not as app chrome. Never recolour them,
   never substitute initials.
3. **Knowledge-base file kinds.** `file-glyph.tsx` maps eight categories to eight hues,
   always as `bg-<hue>-500/10 text-<hue>-600 dark:text-<hue>-400` behind a
   `size-6 rounded-md` (or `size-10 rounded-lg`) plate. The hue means _what kind of file_,
   never _how it is doing_.
4. **Index status.** `kb-status.tsx` is the one place with a status ramp: amber for
   indexing, yellow for queued, emerald for indexed, `destructive` for failed, and
   `muted-foreground` for unsupported or not indexed. Rendered either as a bare tone or as
   a `rounded-md px-2 py-1` plate. This is the only green in the product; do not
   generalise it into a success colour elsewhere.

Photographic content gets a pure edge rather than a tinted one:
`outline outline-black/10 dark:outline-white/10` on any user image or thumbnail.

## Typography

One family: `font-sans`, a system stack starting with `-apple-system-body`, so on Apple
platforms the UI inherits the OS body font and its dynamic type size. `html` and `body`
already set `font-sans text-sm font-normal`, so a screen never sets a family.

What covers almost all text:

- `text-lg font-semibold` is the in-page title, in an `<h1>`, and belongs to screens that
  name a record or a collection (`ChatsBrowser`, a cron detail). A screen named by the
  shell header does not repeat that name in its body.
- `text-xs text-muted-foreground text-pretty` is the one-line page description under it,
  and metadata everywhere.
- `text-sm font-medium` is a row title, card title, section heading in the knowledge-base
  toolbar, or anything clickable-and-named.
- `text-sm` is body copy, form values, menu rows, and table cells.
- `text-xs/relaxed` is card and empty-state body copy.
- `text-xs font-medium text-muted-foreground` is a group or section label (chat date
  groups, `Section` headings on a cron detail).
- `text-base` belongs to the conversation: the composer, message bubbles, the inline
  message editor, and every assistant markdown heading. The composer keeps `md:text-base`
  so it does not shrink on desktop.
- `text-2xl font-semibold tracking-tight` appears twice: the new-chat hero and the two
  big-canvas dialog titles (upload, create project).
- `tabular-nums` goes on any number that changes in place: tab counts, timestamps,
  schedule summaries, file sizes, page numbers, reaction counts.

The chat surface also runs a finer scale in arbitrary values: `text-[13px]` for thinking
trace rows and source titles, `text-[12px]` for timestamps and pagers, `text-[11px]` for
citation pills and tile captions, `text-[10px]` for the role badge. Treat 13px and 11px as
real (if untokenized) steps that the transcript needs; `text-[12px]` is a duplicate of
`text-xs` and should not spread further.

Long strings are handled, not truncated by accident: `text-balance` on headings,
`text-pretty` on descriptions, `truncate` with `min-w-0` on rows, `line-clamp-2` /
`line-clamp-3` on preview cards.

## Layout

`AppShell` is the frame: `SidebarProvider` (`h-svh overflow-hidden`, 16rem open, 3rem
icon-collapsed, 18rem as a sheet below `md`) plus `SidebarInset`, flush against the
sidebar's `border-r` with no margin, rounding, or shadow. Inside it:

```tsx
<header id="app-header" className="flex h-12 shrink-0 items-center gap-1 border-b px-3">
<main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
```

That `<main>` is the app's single scroller, and the header's `border-b` continues the
sidebar's under-logo separator so the two meet as one line. The sidebar header is
`h-12 px-2 py-0` for exactly that reason.

A screen never draws its own top bar. By default the shell fills the header with the
route's icon and name (`pageTitleFor` in `@/lib/nav-items`); a screen that needs the bar
for itself portals into it with `HeaderSlot` from `@/components/shell/header-slot`, which
suppresses the default while mounted and lets the page add an `ml-auto` action.

Page scaffolding, verbatim from the product routes:

```tsx
<div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 p-6">
```

`p-6` padding, `gap-5` between sections, centred with a container cap that depends on the
screen: `max-w-4xl` for lists (chats, projects, crons), `max-w-5xl` for the knowledge base
(a table wants width), `max-w-3xl` for the chat transcript, the composer that shares its
edges, and a cron detail, `sm:max-w-sm` for an ordinary dialog. `memory.tsx` is the
outlier: `flex flex-col gap-6 overflow-y-auto p-6`, uncapped and uncentred. That is drift,
not a pattern; a new editor page should take `max-w-3xl` and `gap-5`.

The spacing rhythm inside that: `gap-5` between sections, `gap-3` between a header row and
its controls, `gap-2.5` inside a control cluster, `gap-2` for list rows and inline
clusters, `gap-1` / `gap-1.5` inside a row (title next to badge, icon next to label),
`gap-0.5` between row-action icon buttons. `gap-6` is the transcript's rhythm and a
big-canvas dialog's.

The sidebar is a stack of pushable panels rather than a tree: `SidebarHeader` (logo,
wordmark, trigger) → separator → search button with a `⌘K` `Kbd` → the active panel
(root items, Projects, Recents) → `SidebarFooter` (connectors card, Settings, `NavUser`).
Projects and Recents are `group-data-[collapsible=icon]:hidden`, so an icon-collapsed rail
shows only leaf destinations.

Mobile: only `sm:` and `md:` are load-bearing, plus `max-sm:` to reveal hover-only actions
on touch. The sidebar becomes a sheet below `md` (a JS breakpoint at 768px, not a media
query). The composer pads for the home indicator with
`pb-[calc(1rem+env(safe-area-inset-bottom))]`.

## Elevation & Depth

Turium is close to shadowless. Hierarchy is tonal (page grey vs card white) plus a
hairline edge, and the two edge idioms are not interchangeable:

- `ring-1 ring-foreground/10` is the **elevated-surface** edge: card, dialog,
  alert-dialog, popover, dropdown-menu, context-menu, select, combobox, command,
  hover-card, menubar, navigation-menu, and the app-side mention menu and file preview.
  Whisper-thin, and derived from `foreground` so it is visible in both themes.
- `border` / `divide-border` groups things **in the flow of the page**, and is also what
  every form control uses (`border-input` on input, textarea, native-select, select
  trigger, input-group; `border-border` on item, attachment, toast, kbd, outline button,
  outline badge). A list is `divide-y divide-border overflow-hidden rounded-xl border
border-border`: one box with hairlines inside it, not a stack of cards.
- `shadow-md` is the menu layer (dropdown-menu, popover, select, hover-card). `shadow-lg`
  is the modal layer (command palette, sheet, toast, lightbox, hover preview card).
  `shadow-sm` appears on the floating sidebar variant, the input-group, and a PDF page.
- Modal separation is the overlay, not a shadow: `bg-black/10` with
  `supports-backdrop-filter:backdrop-blur-xs`. An image lightbox is the exception and uses
  `bg-black/70`, because a photo needs a dark room.
- The composer sits over the transcript behind a gradient scrim, not a shadow:
  `bg-gradient-to-t from-background from-70% to-transparent`. The transcript viewport adds
  `scroll-fade-b`, a masked bottom fade.

Do not add a shadow to give something importance. Change its surface token, or give it a
ring if it floats and a border if it does not.

## Motion

`duration-150 ease-out` is the most common pair in the product, with `duration-200` for
something larger and `duration-300` for a disclosure. Hover and focus changes are
`transition-colors`; size and position changes name their property
(`transition-[transform,opacity]`, `transition-[grid-template-rows]`,
`transition-[background-color,scale]`, `transition-[width]`).

The motion that has a purpose:

- Entrances use `tw-animate-css` utilities, not a library:
  `animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both`. Rows
  use `slide-in-from-bottom-1`.
- Lists cascade: `130 + Math.min(row, 8) * 45` ms, applied via inline `animationDelay`, so
  the first row lands at 130ms and a long page caps at 490ms. Tabs get a fixed 65ms beat
  ahead of the rows. The cascade is skipped while a search filter is active, because a
  re-render cascade reads as lag.
- Skeletons are not delayed by a timer; they mount immediately with
  `style={{ animationDelay: "500ms" }}` on their `animate-in` wrapper, so a fast fetch
  resolves before anything is visible. Do this on new loading states; `crons` and
  `memory` still flash theirs, which is the bug this pattern fixes.
- Overlays open in `180ms` on `cubic-bezier(0.165,0.84,0.44,1)` and close faster, in
  `130ms` on `cubic-bezier(0.4,0,1,1)`, via `data-open:` / `data-closed:`. The command
  palette swaps the open for a `motion` spring (`duration: 0.3, bounce: 0`).
- The sidebar's nested panels slide `duration-220 ease-[cubic-bezier(0.32,0.72,0,1)]`, an
  iOS-style push where the offstage panel is `inert` and back is the same transition
  reversed. Collapsible sidebar groups animate `grid-template-rows` in `260ms` on
  `cubic-bezier(0.16,1,0.3,1)` and out in `180ms` on `cubic-bezier(0.4,0,1,1)`.
- `cubic-bezier(0.23,1,0.32,1)` is the house keyframe easing (`animate-reaction`,
  `animate-link-preview`, the scroll-to-bottom button's entrance). It exists only in CSS;
  TSX reaches for `ease-out`.
- Disclosures animate `grid-template-rows` between `0fr` and `1fr` with `duration-300
ease-out`, paired with `inert={!open}`: thinking traces, source lists, the composer's
  link preview and attachment row.
- Streaming is the product: the top progress bar creeps toward 90% rather than claiming
  completion, and the live thinking label uses `animate-shimmer` (2.5s linear).
- Controls acknowledge press: `Button` uses `active:translate-y-px` (suppressed on
  `aria-haspopup` triggers so a menu opener does not bounce), while icon-sized affordances
  outside it use `active:scale-[0.96]`.
- `motion/react` handles what CSS cannot measure: staged-upload rows animating a measured
  height, the knowledge-base hover preview gliding between rows
  (`{ type: "spring", duration: 0.35, bounce: 0 }`), the connector card's enter/exit. Each
  gates on `useReducedMotion()` with a `const NONE = { duration: 0 }`.

Always honour reduced motion. Every `@utility` in `globals.css` disables itself, and
anything hand-rolled pairs with `motion-reduce:transition-none` or
`motion-reduce:animate-none`. Coverage is not yet complete (the scroll-to-bottom button,
the PDF panel slide-in, and the `chats-browser` cascades have no guard); add the guard,
don't copy the omission.

## Shapes

Every radius resolves through `--radius: 0.625rem`, so the scale steps by 4px around 10px:

- `rounded-sm` 6px, barely-rounded: tooltips, role badges, reply quotes, mention chips,
  the link-preview card inside a bubble.
- `rounded-md` 8px, the primitive default: buttons, inputs, badges, cards, skeletons, menu
  items, citation pills, sources rows, file glyph plates, the app logo tile.
- `rounded-lg` 10px, softly rounded: message bubbles, the day divider, the tap target
  inside a list row, mention-menu rows, thinking-trace headers, palette rows.
- `rounded-xl` 14px, the dominant product radius: list containers, error blocks,
  attachment and draft tiles, mention menu, model and effort popovers, the cron strip,
  toasts, member and folder rows.
- `rounded-2xl` 18px: dialogs and the command palette, the knowledge-base panel, soft
  cards (project kinds, search hits), dropzones, the composer's reply banner and link
  preview, and the icon tile in an empty state (`size-11 rounded-2xl`).
- `rounded-3xl` 22px: the composer and its drag overlay, the connectors bar tucked under
  it (`rounded-b-3xl`), and the two big-canvas dialogs.
- `rounded-full` for pills: status dots, avatars, send/stop/attach, model and effort
  triggers, reaction chips, remove buttons, the scroll-to-bottom button.

The pattern is that the further out a surface floats, the rounder it gets, and small
controls inside it stay at 8-14px. Concentricity is deliberate where it is written down:
a link preview inside a bubble is `rounded-sm` pulled `-mx-3` inside a `rounded-lg` bubble
so 4px of surround holds a 6px inner radius inside a 10px outer one. Nothing is square;
`rounded-none` appears only to undo an inherited radius. Circles are for controls and
indicators, never for content.

## Components

Import them, do not rebuild them. The specs that matter when composing:

**Button** (`variant` × `size`, cva). Variants: `default` (solid `primary`), `outline`,
`secondary`, `ghost`, `destructive` (tinted `bg-destructive/10 text-destructive`, not
solid), `link`. Sizes: `xs` 24px, `sm` 28px, `default` 32px, `lg` 36px, and the square
`icon-xs` 24px / `icon-sm` 28px / `icon` 32px / `icon-lg` 36px. All compact by design.
Focus is `focus-visible:border-ring focus-visible:ring-1 ring-ring/50`, press is
`active:not-aria-[haspopup]:translate-y-px`, disabled is `opacity-50 pointer-events-none`.
Icons are sized automatically; mark leading and trailing icons with
`data-icon="inline-start"` / `data-icon="inline-end"` so the button tightens that side's
padding. To render a button as a link or a menu trigger, pass `render={<Link to="…" />}`
(Base UI's render prop, not `asChild`).

**Input** 32px, `rounded-md`, transparent background, `border-input`, `text-sm`. A search
field is an `Input` with `className="pl-7.5"` and an absolutely positioned
`pointer-events-none size-3.5 text-muted-foreground` icon at `left-2.5 top-1/2
-translate-y-1/2`, inside a `relative w-44 sm:w-56` wrapper. **Textarea** is `min-h-16`
and `text-xs` (not `text-sm`), `field-sizing-content`, so a raw-text editor is a
`Textarea` with `className="font-mono text-xs"`.

**Card** `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardAction` /
`CardContent` / `CardFooter`. Body text is `text-xs/relaxed`, internal spacing comes from
`--card-spacing` (16px, 12px with `size="sm"`), so set padding through that variable and
not with `p-*`. Note the product mostly does **not** use `Card`: a bordered `<ul>`, a
`rounded-xl border` section, or a `bg-accent/35 rounded-2xl` soft card is more common.

**Badge** 20px, `rounded-md`, `text-xs font-medium`. `secondary` for a neutral state
("Archived"), `outline` for a qualifier ("Paused", "Active", "Owner", a scope name),
`destructive` for a failed run. Hover only applies to link badges.

**Dialog** / **AlertDialog** `rounded-2xl`, `p-6`, `gap-5`, `sm:max-w-sm`, ringed, with a
`ghost` `icon-sm` close button at `top-4 right-4`. `DialogTitle` is
`text-lg font-semibold`, `DialogDescription` is `text-sm/relaxed text-muted-foreground`.
Footers are `flex-col-reverse gap-2 sm:flex-row sm:justify-end`, so the primary action is
last in DOM order and rightmost on desktop. Widen with `sm:max-w-lg` / `sm:max-w-xl` when
a form needs it. Use `AlertDialog` for destructive confirmation, with the object named in
the title and the consequence in the description; `forceOverlay` re-adds the backdrop for
a dialog opened from a dialog.

There is a second, larger dialog dialect for a create-or-upload canvas:
`rounded-3xl p-8 gap-6 sm:max-w-xl` (or `sm:max-w-3xl`), a `text-2xl font-semibold`
title, and `h-10 rounded-xl` footer buttons. Use it only for a step-through flow with a
dropzone or a grid of choices, and stay inside the default shell otherwise.

**Empty** `Empty` / `EmptyHeader` / `EmptyMedia` / `EmptyTitle` / `EmptyDescription` /
`EmptyContent`. The house form of the media slot, repeated identically across every
screen, is `<EmptyMedia variant="icon" className="size-11 rounded-2xl [&_svg]:size-5">`.

**Skeleton** `animate-pulse rounded-md bg-muted`; product screens override to
`rounded-xl` and size it to the row it stands in (`h-14` for a chat row, `h-16` for a cron
row, `h-3.5` for a table cell).

**Spinner** 16px spinning Hugeicon with `role="status"`. Inside a button, pass
`data-icon="inline-start"` and swap it in for the leading icon while pending.

**Tabs** always `<TabsList variant="line">`, rendered only when more than one tab is
populated, with the count beside the label as
`<span className="text-muted-foreground tabular-nums">`, never a badge.

**Table** used once, in the knowledge base: `<Table className="table-fixed text-sm">`,
fixed column widths in a local `COL` map, `TableRow className="hover:bg-transparent"` on
header rows, heads `text-sm font-medium text-muted-foreground` with
`hidden sm:table-cell` on the columns that drop on mobile, cells `py-2.5`. A sortable head
is `TableHead className="p-0"` wrapping a full-bleed `h-10` button whose arrow is
`opacity-0 group-hover:opacity-60` until active.

**Tooltip** the app wraps `__root.tsx` in `<TooltipProvider openDelay={400}>`, and screens
that need their own re-declare it at 400. Content is inverted (`bg-primary
text-primary-foreground`), `rounded-sm`, `px-3 py-1.5 text-xs`. A `Kbd` inside a tooltip
inverts itself automatically.

**Sidebar** compose with `SidebarGroup` / `SidebarGroupLabel` / `SidebarMenu` /
`SidebarMenuItem` / `SidebarMenuButton`. Group labels are
`text-sm text-sidebar-foreground/60`; the active state comes from
`isActive` (`data-active:bg-sidebar-accent data-active:font-medium`), never from a
hand-written class. `SidebarMenuButton variant="outline"` is the search-field look.

**Bubble** / **Message** / **MessageScroller** the chat primitives. `MessageScroller`
supplies the transcript's `gap-6`, its `scroll-fade-b` viewport, and the
scroll-to-bottom `MessageScrollerButton`. `Bubble variant="ghost"` is assistant prose (no
fill, no padding); `variant="destructive"` is a failed turn; `align="end"` is the user
side and caps at `max-w-[80%]`. `BubbleContent`'s base is `rounded-md px-2.5 py-2
text-xs`, which the chat surface overrides wholesale; see Patterns.

**Toaster** Sonner, mounted once in `__root.tsx` at `position="top-right"` with
`richColors`, themed to `background` / `border` / `shadow-lg` / `rounded-xl`.

**UserAvatar** (`@/components/shell/user-avatar`) is the only way a person is pictured. It
wraps `Avatar` at `size="sm"` 24px / `default` 32px / `lg` 40px, always circular with a
`border-border` faux ring, and fills it with a `FluidOrb` whose colour and noise pattern
both come from a hash of the lowercased identity string. The orb is a still frame, ordered
dithered to 8 levels through an 8x8 Bayer threshold: one shared WebGL context draws every
distinct orb once and caches the result, so a long message list costs no contexts and no
animation frames. Because dither is a pixel-grid effect, each orb renders at the CSS pixel
size it is displayed at, measured on mount, and the cache is keyed by that size. **AgentAvatar** is the agent's
equivalent, always 24px and
`aria-hidden`. Never substitute initials; there is no `AvatarFallback` in either.

Raw text and commands are `font-mono text-xs`: a command block is
`rounded-md bg-muted px-2 py-1.5 font-mono text-xs whitespace-pre-wrap` on a `<code>`.

## Patterns

**Index page.** Every list screen is the same five blocks in the same order, inside
`mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 p-6`:

1. Header row: `flex flex-wrap items-start justify-between gap-3`. Left is a
   `flex flex-col gap-1` with (optionally) an `<h1>` and a
   `text-xs text-muted-foreground text-pretty` one-line description of what the screen is
   for. Right is a `flex items-center gap-2` with the search field, filters, and the
   primary action.
2. `<TabsList variant="line">` with counts, rendered only when there is more than one
   populated tab.
3. Loading: three `Skeleton` rows sized like the real rows, delayed 500ms.
4. Error: the inline `border-destructive/30 bg-destructive/5` block with an `errMessage`
   fallback.
5. Success: the list, or a search-specific empty state ("No matches" with a Clear search
   button), or the tab's own empty state. Check the search-empty branch first.

**List rows.** A list is one bordered box, not a stack of cards:

```tsx
<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
  <li className="group flex items-center gap-2 px-3 transition-colors hover:bg-muted/40 focus-within:bg-muted/40">
    <Link className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg py-3 outline-none focus-visible:ring-1 focus-visible:ring-ring">
      <span className="flex items-center gap-2">
        <span className="min-w-0 truncate text-sm font-medium">{title}</span>
        <Badge variant="outline">{qualifier}</Badge>
      </span>
      <span className="truncate text-xs text-muted-foreground tabular-nums">{meta}</span>
    </Link>
    <RowActions />
  </li>
</ul>
```

Note the split: the `<li>` owns padding, hover, and the group; the `<Link>` owns the
vertical padding and the focus ring, so the whole row highlights but only the link is
focusable.

**Row actions.** Icon-only `ghost` buttons that appear on hover and stay visible on touch,
each wrapped in a `Tooltip` whose content is the same string as its `aria-label`:

```tsx
<div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-sm:opacity-100">
```

Colour by consequence: `text-muted-foreground hover:text-foreground` for ordinary actions,
`hover:text-destructive` for delete. Inside the sidebar the same idea uses the named group
(`group-hover/menu-item:opacity-100 group-has-focus-visible/menu-item:opacity-100
md:opacity-0`), because touch has no hover.

**Grouped lists.** Chats group by recency into `Today` / `Yesterday` / `Previous 7 days` /
`Older`, each a `<section className="flex flex-col gap-2">` with an
`<h2 className="text-xs font-medium text-muted-foreground">` above its own bordered
`<ul>`, and `gap-5` between groups.

**Detail page.** A cron detail is the model: a back link
(`inline-flex w-fit items-center gap-1.5 rounded-md py-1 text-xs text-muted-foreground
hover:text-foreground`), a title block (`h1` `text-lg font-semibold text-balance` plus a
status `Badge`, then a `text-xs text-muted-foreground tabular-nums` line), an action row,
then sections. A section is `flex flex-col gap-3 rounded-xl border border-border p-4` with
an `h2` of `text-xs font-medium text-muted-foreground`. Key/value data is a
`<dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[10rem_1fr]">` whose rows are
`className="contents"`.

**Action rows.** `flex flex-wrap items-center gap-2`, primary first, `outline` for the
rest, and the destructive action pushed to the far edge with
`variant="destructive" className="ml-auto"`. One shared `busy` flag disables the whole
cluster. On an editor page the row is primary then `variant="outline"` "Discard changes",
both disabled until the draft is dirty.

**Chat surface.** A `MessageScroller` whose content is
`mx-auto w-full max-w-3xl px-4 pt-6 pb-40` (the bottom padding clears the composer), on
the primitive's `gap-6` rhythm. The composer is pinned in a
`pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background
from-70% to-transparent pt-8 pb-[calc(1rem+env(safe-area-inset-bottom))]` scrim whose
inner wrapper is `pointer-events-auto mx-auto w-full max-w-3xl px-4`. That wrapper repeats
the transcript's own cap and padding rather than padding the scrim, so the composer's
edges land on the message edges at every width.

Consecutive messages from one author within 15 minutes are a _run_: the follower carries
`RUN_GAP_PULL` (`-mt-4`), closing the 24px gap to 8px, and drops its avatar and author
label while keeping the `w-6 shrink-0` avatar lane open. Author labels are
`flex items-center gap-1.5 text-sm text-muted-foreground`.

Bubbles are the one place the primitive is overridden wholesale, via four constants in
`message-bubbles.tsx`: `rounded-lg! px-4! py-2.5! text-base` over `BubbleContent`'s
`rounded-md px-2.5 py-2 text-xs`, with `bg-accent!` for the other party (including the
agent in a room) and a hardcoded near-`accent` grey for your own. The importants exist
only to beat the primitive; if you touch this, add a bubble variant instead of another
`!`. Timestamps are floated into the last line (`float-right ml-3 translate-y-[10px]
leading-[1.625rem]`) on user bubbles and absolutely positioned (`absolute right-4
bottom-2` over `pb-7!`) on assistant ones.

Assistant prose is `Bubble variant="ghost"` wrapping `Streamdown` at `text-base`;
`assistant-markdown.tsx` overrides only `h1`–`h6` (all to `mt-6 mb-2 text-base
font-semibold`) and `a`, so every other element is a Streamdown default. Below the prose
sit a thinking trace, a sources disclosure, and a `MessageActions` row that reveals on
`group-hover/message`.

**Composer.** `InputGroup` at `rounded-3xl dark:bg-sidebar`. All text metrics live in one
constant (`px-3.5 pt-3.5 pb-2 text-base sm:px-4 sm:pt-4 md:text-base`) applied to both the
textarea and the mention mirror behind it: the textarea is `text-transparent
caret-foreground` so the mirror can paint mention chips. Controls sit in an
`InputGroupAddon align="block-end"`: attach (`icon-xs` `rounded-full`), model and effort
triggers (`rounded-full px-2 text-sm`, hidden in a room), then send or stop
(`size-9 rounded-full ml-auto`). Collapsing regions (link preview, attachment row) animate
`grid-template-rows`. The drag-over overlay is
`absolute inset-0 z-20 rounded-3xl border-2 border-dashed border-primary/60
bg-background/85`.

**New chat.** The centred hero:
`mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-7 px-4 py-6`,
an animated `text-2xl font-semibold tracking-tight` question, the composer at
`delay-100`, then `PromptSuggestions`, rows on their own `200 + index * 45` ms cascade.

**Knowledge base.** One `rounded-2xl border border-border` panel filling the page, with a
`border-b p-2.5` toolbar (title, count, search, filters), a scrolling table body whose
`perPage` is derived from the measured height, and a `border-t p-2.5` footer holding
`Pagination`. Dropzones are
`h-40 rounded-2xl border border-dashed` with `border-primary bg-accent/60` while dragging;
the page-level drop target is a `bg-background/60` overlay with a dashed pill inside it.

**Filters.** `Select` (or `NativeSelect`) at `size="sm"` with an `aria-label`, in a
`flex flex-wrap items-center gap-2` row, with the popup content always
`align="start" alignItemWithTrigger={false}`. Search is debounced 180ms with a minimum
query length, not searched per keystroke.

**Async state.** Every screen branches `isPending` → skeleton, `isError` → inline message
with an `errMessage` fallback, `isSuccess` → content or empty state. Index pages inline
those three with `&&`; detail pages early-return a full page per state and add a fourth
"not found" branch after `isSuccess`. Mutations disable their trigger, swap the leading
icon for a `Spinner`, and target a single row by comparing
`mutation.variables === row.id`.

**Command palette** `⌘K` from anywhere, or the sidebar's search button. Rows are
`rounded-lg px-3 py-2.5 text-sm` with a `size-10 rounded-md bg-muted` icon tile, a
title/description column, and a `Kbd` well whose jump number crossfades to an enter icon
when the row is selected. Scope
chips above the list are `h-8 rounded-md border px-2.5 text-xs font-medium` with
`active:scale-[0.96]`. Group order flips when a query is present so results outrank
navigation.

## Voice & Content

Sentence case everywhere, in headings, buttons, labels, and toasts. No title case, no
exclamation marks, no emoji.

- Buttons are a verb or a short verb phrase: `Save`, `Restore`, `Run now`, `Upload`,
  `New chat`, `Clear search`, `Clear filters`, `Discard changes`, `Go to crons`, `Done`,
  `Next`, `Back`. A destructive confirmation states what it does: `Delete permanently`,
  `Delete project`, never `Confirm`.
- Errors are `Could not <verb> <object>.`, a full sentence with a period, always passed as
  the fallback to `errMessage(error, "…")`: `Could not load your chats.`,
  `Could not save memory.`, `Could not create that project.`, `Could not reach the
agent.` Never blame the user, never show a raw status code, never say "Oops" or
  "Something went wrong".
- Where an error has a fix, the sentence carries it: `Memory changed in another
conversation. Reload to get the latest version, then reapply your edits.`
- Success toasts are terse fragments with no period: `Cron paused`, `Run started`,
  `Project deleted`, `Uploaded 3 files`, `Document queued for indexing`. Only confirm what
  the user cannot see for themselves; do not toast a visible change. A toast may carry a
  consequence as a second sentence when there is one: `Project deleted. 2 chats moved
back.`
- Counts inline their own pluralisation: `${n} file${n === 1 ? "" : "s"}`. There is no i18n
  layer.
- Page descriptions are one line, second person, saying what the screen is for:
  "Recurring work the agent runs for you, on its own.", "Every conversation you have had
  with the agent.", "Documents your agent can search and use.", "What the agent carries
  between conversations."
- Empty states are a short noun phrase title plus one sentence explaining what will fill
  it: `No crons yet` / "Describe recurring work once and the agent keeps running it on
  schedule."; `No files yet` / "Upload a document here, or ask the agent to create one."
- Placeholders are lowercase-continued and use the ellipsis character: `Message turium…`,
  `Turium is working…`, `Uploading 2/3…`, `Asking the agent…`, `Searching…`. Never `...`.
- Curly quotes for interpolated user content: `Delete “{name}”?`,
  `Nothing here matches “{query}”.` Curly apostrophes in prose: `aren’t`.
- `·` is the metadata separator on every meta line (`{schedule} · {lastRun}`,
  `{size} · {date} · {scope}`). `—` stands in for an absent value.
- Lowercase machine-ish values pass through unstyled and unmodified: `never fired`,
  `one-time`, `every 15m`, `default timezone`.
- The product is "turium" in conversational copy ("Sign in to continue to turium.") and "Turium"
  as the app name in the sidebar.
- Every icon-only control has an `aria-label`, and its tooltip repeats that exact string.
  Prefer a composite label over a bare verb: `React with ${emoji}`,
  `Change model — ${label}`, `Read by ${readers} of ${of}`,
  `Go to the message from ${author}`.

## Do's and Don'ts

- Do reference tokens through their utility. No raw hex, no `rounded-[10px]`.
- Do treat the theme as achromatic. The only sanctioned off-theme colour is the `sky`
  addressing accent, the twelve orb avatar colours, the eight knowledge-base file-kind
  hues, and the amber/yellow/emerald index-status ramp. A new hue needs a new meaning, not
  a new screen.
- Don't copy these existing violations; they are debt with known replacements:
  `bg-[#F3F3F4] dark:bg-neutral-800` on user bubbles and the day divider (a one-digit-off
  duplicate of `accent`), the `neutral-*` scroll-to-bottom button and its
  `shadow-[0_4px_16px_oklch(…)]` in `chat-view.tsx`, `bg-[#E6E6E6]` / `hover:bg-[#D9D9D9]`
  in `document-citation.tsx`, the `emerald-500` upload tick in `composer.tsx`, and the
  four score hexes in `model-picker.tsx`. The equivalents are `bg-accent`, `bg-card` with
  a ring, and `bg-primary`.
- Do derive shades with an opacity modifier (`bg-muted/40`, `bg-accent/35`,
  `border-destructive/30`) instead of adding a colour.
- Do use `ring-1 ring-foreground/10` for a surface that floats and a `border` for one that
  sits in the page. Don't add a shadow for emphasis, and don't put a ring on a form
  control.
- Do import from `@/components/ui/*`. Don't hand-roll a button, input, dialog,
  skeleton, table, or empty state. If a primitive is close but wrong, add a variant to it
  rather than a wall of `!` overrides at the call site.
- Do put screen-level controls in `HeaderSlot`. Don't render a second header inside a
  page.
- Do keep `text-base` inside the chat surface. Everywhere else the body size is `text-sm`
  and metadata is `text-xs`. Don't introduce a new arbitrary pixel size outside the
  transcript, and never write `text-[12px]`, which is `text-xs`.
- Do pair `truncate` with `min-w-0`, and give headings `text-balance` and descriptions
  `text-pretty`.
- Do give every hand-rolled animation a `motion-reduce:` escape, and name the properties a
  transition applies to instead of using bare `transition-all` on layout.
- Do use `render={<Link />}` on Base UI primitives. `asChild` is not the API here.
- Don't rely on later-wins class ordering to override a primitive: `cn` here is not
  `tailwind-merge`, so conflicting utilities both ship and specificity decides.
- Don't mix radius families on one surface: a 14px container holds 8px controls, and a
  22px composer holds pill buttons.
- Don't reach for a colour to signal success. Success is a toast plus the absence of an
  error; the only green in the product is the knowledge-base "Indexed" status.
- Don't add a scrollbar affordance by styling one: scrollbars are hidden globally. Use
  `scroll-fade-b` or a scroll-to-bottom button.
- Don't "clean up" `follow.ts`: the synthetic `WheelEvent` it dispatches is what releases
  the transcript from follow-bottom when a disclosure opens.
