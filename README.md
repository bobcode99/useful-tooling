# Useful Tooling

A collection of developer utilities built with TanStack Start, React, and Tailwind CSS.

## Tools

| Tool | Path | Description |
|------|------|-------------|
| JSON Diff | `/json-diff` | Compare two JSON files. Order-insensitive (arrays sorted). Syntax highlighting, nested diff tree. |
| Random Number | `/random` | Generate random integers in a configurable range. |

## Stack

- **TanStack Start** — SSR-enabled React framework with file-based routing
- **Tailwind CSS v4** — Styling with class-based dark mode
- **react-syntax-highlighter** — JSON syntax highlighting (Prism)
- **json-diff-ts** — JSON diff computation
- **Biome** — Lint + format

## Dev

```bash
bun install
bun run dev        # http://localhost:3000
bun run build
bun run check      # lint + format
bun run test
```

## Adding a tool

1. Create `src/routes/your-tool.tsx` with `createFileRoute('/your-tool')`
2. Add nav entry to `navItems` in `src/routes/__root.tsx`
3. Run dev — TanStack Router auto-regenerates `src/routeTree.gen.ts`

## Deploy

```bash
bun run build
node dist/server/index.mjs
```

Nitro output runs on any Node host. For platform presets (Vercel, Cloudflare, etc.) see [nitro.build/deploy](https://v3.nitro.build/deploy).
