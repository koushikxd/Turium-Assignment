# turium

A TypeScript monorepo that combines Vite, React, Express, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Vite + React** - Frontend with TanStack Router and TanStack Query
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - primitives live in `apps/web/src/components/ui`
- **Express** - Fast, unopinionated web framework
- **Node.js** - Runtime environment
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## UI Customization

shadcn/ui primitives live in `apps/web`.

- Change design tokens and global styles in `apps/web/src/index.css`
- Update primitives in `apps/web/src/components/ui/*`
- Adjust shadcn aliases or style config in `apps/web/components.json`

### Add more components

```bash
npx shadcn@latest add accordion dialog popover sheet table -c apps/web
```

Import components like this:

```tsx
import { Button } from "@/components/ui/button";
```

## Environment Configuration

The server owns its environment schema in `apps/server/.env.schema`. Varlock generates `src/env.ts` during installation; run `pnpm run env:generate` after changing a schema. Commit schemas, and keep secrets in ignored env files or your deployment platform.

Import the generated `ENV` accessor in application code. See [Varlock's monorepo guide](https://varlock.dev/guides/monorepos/).

The server bootstrap loads Varlock. Node deployments must include Varlock and its dependencies alongside the app schema.

## Git Hooks and Formatting

Lefthook installs a `pre-commit` hook that runs Oxlint (`--fix`) and Oxfmt over staged
files and re-stages what it fixed. Anything Oxlint cannot fix automatically blocks the
commit.

The hook is installed by the `prepare` script during `pnpm install`, and is skipped
outside a git repository. After `git init`, run `pnpm install` once to install it.

- Run checks manually: `pnpm run check`

## Project Structure

```
turium-assignment/
├── apps/
│   ├── web/         # Frontend application (Vite + React)
│   └── server/      # Backend REST API (Express)
├── packages/
│   ├── contracts/   # Zod schemas shared by server and web
│   └── config/      # Shared tsconfig
```

## Available Scripts

- `pnpm run dev`: Start all applications in development mode
- `pnpm run build`: Build all applications
- `pnpm run dev:web`: Start only the web application
- `pnpm run dev:server`: Start only the server
- `pnpm run check-types`: Check TypeScript types across all apps
- `pnpm run check`: Run Oxlint and Oxfmt
