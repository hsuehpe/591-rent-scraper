# TypeScript Migration Design

## Goal

Migrate the 591 rent scraper from JavaScript to TypeScript with a real build step while preserving current runtime behavior.

## Current System

The app is a small CommonJS Node.js scraper. `index.js` loads `config.json`, schedules `checkForNewListings`, calls `crawler/crawlOnePage.js`, compares results against `591_data.json`, and sends Discord notifications through `utils/notify.js`. The scraper uses Playwright to render 591 pages and Cheerio to extract listing data. History is stored as JSON in the project root.

There are existing local changes in `index.js`, `package.json`, `config.json`, the deleted `.env.example`, and the untracked `pnpm-lock.yaml`. The migration must preserve those changes unless a TypeScript build requirement directly touches the same file.

## Chosen Approach

Use a full TypeScript source migration with CommonJS output:

- Move runtime source files into `src/`.
- Convert `.js` files to `.ts`.
- Add `tsconfig.json`.
- Compile TypeScript into `dist/`.
- Run production code with `node dist/index.js`.
- Keep `config.json` at the project root and import it with `resolveJsonModule`.
- Keep `591_data.json` at the project root so existing history survives the migration.

This avoids the extra runtime changes of an ESM migration while still making TypeScript the source of truth.

## File Layout

```text
src/
  index.ts
  types.ts
  crawler/
    crawlOnePage.ts
  utils/
    history.ts
    notify.ts
dist/
  index.js
  ...
```

`src/types.ts` will define shared data contracts:

- `Listing`: `{ id: string; title: string; link: string }`
- `History`: `Listing[][]`
- `Config`: `{ urls: string[]; intervalMinutes: number; fetchCount: number }`

## Module And Runtime Strategy

TypeScript will compile to CommonJS. The generated `dist/index.js` can run in Node without changing the package to ESM. JSON imports will be enabled with `resolveJsonModule`, and `esModuleInterop` will support default imports from packages such as `axios` and `cheerio`.

The package entry point will become `dist/index.js`. Scripts will include:

- `build`: compile TypeScript to `dist/`
- `start`: run `dist/index.js`
- `dev`: run `src/index.ts` directly with `tsx`
- `typecheck`: run `tsc --noEmit`

## Behavior Preservation

The migration will not change scraper behavior. It will preserve:

- The current configured URLs, interval, and fetch count in `config.json`.
- The enabled interval scheduling in `index`.
- The root-level `591_data.json` read/write path.
- Optional Discord notification behavior when `DISCORD_WEBHOOK_URL` is not set.
- The current 300 ms delay between Discord listing messages.

## Error Handling

The existing behavior of treating an unreadable or missing `591_data.json` as empty history will remain. TypeScript-specific changes will narrow caught errors only where needed, especially in Discord notification logging, because caught values are `unknown` under stricter settings.

## Testing And Verification

The migration is successful when:

- `pnpm typecheck` passes.
- `pnpm build` passes and emits `dist/`.
- The compiled app starts with `pnpm start`.

Starting the app may contact the live 591 site and open a Playwright browser. If verification needs to avoid network side effects, `pnpm typecheck` and `pnpm build` are the minimum local checks.

## Out Of Scope

This migration will not redesign the scraper, alter listing detection logic, change Discord message formatting, replace Playwright or Cheerio, add a test framework, or change package managers.
