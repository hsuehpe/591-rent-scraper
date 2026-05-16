# TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the scraper source from JavaScript to TypeScript, compile it to `dist/`, and preserve current runtime behavior.

**Architecture:** Runtime source moves into `src/` and TypeScript compiles to CommonJS JavaScript in `dist/`. Shared interfaces live in `src/types.ts`; scraper, history, notification, and scheduler logic keep their existing responsibilities.

**Tech Stack:** Node.js, TypeScript, CommonJS output, Playwright, Cheerio, Axios, dotenv, pnpm.

---

## File Structure

- Modify: `.gitignore` to ignore compiled `dist/`.
- Modify: `package.json` to point `main` at `dist/index.js` and add build/start/dev/typecheck/test scripts.
- Create: `tsconfig.json` for CommonJS compilation from `src/` to `dist/`.
- Create: `src/types.ts` for shared `Listing`, `History`, and `Config` types.
- Create: `src/index.ts` from `index.js`.
- Create: `src/crawler/crawlOnePage.ts` from `crawler/crawlOnePage.js`.
- Create: `src/utils/history.ts` from `utils/history.js`.
- Create: `src/utils/notify.ts` from `utils/notify.js`.
- Delete after successful migration: `index.js`, `crawler/crawlOnePage.js`, `utils/history.js`, `utils/notify.js`.
- Modify: `pnpm-lock.yaml` when dev dependencies are installed.

## Task 1: Add TypeScript Tooling

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.gitignore`
- Create: `tsconfig.json`

- [ ] **Step 1: Install TypeScript dev dependencies**

Run:

```bash
pnpm add -D typescript tsx @types/node
```

Expected: `package.json` gains `devDependencies`, and `pnpm-lock.yaml` updates.

- [ ] **Step 2: Update `package.json` scripts and entry point**

Set `main` to `dist/index.js` and set scripts to:

```json
{
  "build": "tsc",
  "start": "node dist/index.js",
  "dev": "tsx src/index.ts",
  "typecheck": "tsc --noEmit",
  "test": "pnpm typecheck"
}
```

Expected: dependencies remain `axios`, `cheerio`, `dotenv`, and `playwright`; the existing `packageManager` field remains unchanged.

- [ ] **Step 3: Add `dist/` to `.gitignore`**

Final `.gitignore` content:

```gitignore
node_modules/
.env
591_data.json
.DS_Store
dist/
```

- [ ] **Step 4: Create `tsconfig.json`**

Create:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Run the empty-source typecheck**

Run:

```bash
pnpm typecheck
```

Expected: fail with an error like `No inputs were found in config file` because `src/` has not been created yet. This confirms the script reaches TypeScript.

- [ ] **Step 6: Commit tooling changes**

Run:

```bash
git add .gitignore package.json pnpm-lock.yaml tsconfig.json
git commit -m "build: add typescript tooling"
```

Expected: commit succeeds without staging unrelated local config changes unless they were already part of `package.json`.

## Task 2: Add Shared Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create the shared type module**

Create `src/types.ts`:

```ts
export interface Listing {
  id: string;
  title: string;
  link: string;
}

export type History = Listing[][];

export interface Config {
  urls: string[];
  intervalMinutes: number;
  fetchCount: number;
}
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: pass, because the project now has at least one valid TypeScript source file.

- [ ] **Step 3: Commit shared types**

Run:

```bash
git add src/types.ts
git commit -m "build: add scraper types"
```

Expected: commit contains only `src/types.ts`.

## Task 3: Convert History Utilities

**Files:**
- Create: `src/utils/history.ts`
- Later delete: `utils/history.js`

- [ ] **Step 1: Create the TypeScript history utility**

Create `src/utils/history.ts`:

```ts
import fs from "node:fs";
import configJson from "../../config.json";
import type { Config, History } from "../types";

const config = configJson as Config;
const historyFile = "591_data.json";

export function loadHistory(): History {
  try {
    const raw = JSON.parse(fs.readFileSync(historyFile, "utf8")) as unknown;
    const storedHistory = Array.isArray(raw) ? raw : [];
    const history: History = [];

    config.urls.forEach((_, index) => {
      const items = storedHistory[index];
      history[index] = Array.isArray(items) ? items : [];
    });

    return history;
  } catch {
    const emptyHistory: History = [];

    config.urls.forEach((_, index) => {
      emptyHistory[index] = [];
    });

    return emptyHistory;
  }
}

export function saveHistory(history: History): void {
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), "utf8");
}
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: pass.

- [ ] **Step 3: Commit history conversion**

Run:

```bash
git add src/utils/history.ts
git commit -m "build: convert history utility to typescript"
```

Expected: commit contains only the new TypeScript history file.

## Task 4: Convert Discord Notification Utility

**Files:**
- Create: `src/utils/notify.ts`
- Later delete: `utils/notify.js`

- [ ] **Step 1: Create the TypeScript notification utility**

Create `src/utils/notify.ts`:

```ts
import "dotenv/config";
import axios from "axios";
import type { Listing } from "../types";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function sendDiscordNotification(
  items: Listing[],
  city: string,
): Promise<void> {
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!discordWebhookUrl) return;

  try {
    await axios.post(discordWebhookUrl, {
      content: `📢 **在 ${city} 發現 ${items.length} 筆新房源**`,
    });

    for (const item of items) {
      await axios.post(discordWebhookUrl, {
        content: item.link,
      });
      await delay(300);
    }

    console.log(`✅ Discord 已通知在 ${city} 的新物件`);
  } catch (error) {
    console.error("❌ 傳送 Discord 通知失敗:", getErrorMessage(error));
  }
}
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: pass.

- [ ] **Step 3: Commit notification conversion**

Run:

```bash
git add src/utils/notify.ts
git commit -m "build: convert notification utility to typescript"
```

Expected: commit contains only the new TypeScript notification file.

## Task 5: Convert Page Crawler

**Files:**
- Create: `src/crawler/crawlOnePage.ts`
- Later delete: `crawler/crawlOnePage.js`

- [ ] **Step 1: Create the TypeScript crawler**

Create `src/crawler/crawlOnePage.ts`:

```ts
import { chromium } from "playwright";
import * as cheerio from "cheerio";
import configJson from "../../config.json";
import type { Config, Listing } from "../types";

const config = configJson as Config;

export async function crawlOnePage(url: string): Promise<[string, Listing[]]> {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    });
    const page = await context.newPage();
    await page.goto(url, { timeout: 60000 });

    const content = await page.content();
    const $ = cheerio.load(content);

    const titleText = $("title").text();
    const match = titleText.match(/【(.+?)出租】/);
    const city = match ? match[1] : "未知";

    const items = $(".list-wrapper .item").slice(0, config.fetchCount);
    const results: Listing[] = [];

    items.each((_, el) => {
      const link = $(el).find("a.link").attr("href") || "";
      const title = $(el).find("a.link").text().trim() || "";
      const idMatch = link.match(/(\d+)$/);
      const id = idMatch ? idMatch[1] : "";

      results.push({ id, title, link });
    });

    return [city, results];
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: pass.

- [ ] **Step 3: Commit crawler conversion**

Run:

```bash
git add src/crawler/crawlOnePage.ts
git commit -m "build: convert crawler to typescript"
```

Expected: commit contains only the new TypeScript crawler file.

## Task 6: Convert Entrypoint

**Files:**
- Create: `src/index.ts`
- Later delete: `index.js`

- [ ] **Step 1: Create the TypeScript entrypoint**

Create `src/index.ts`:

```ts
import configJson from "../config.json";
import { crawlOnePage } from "./crawler/crawlOnePage";
import type { Config } from "./types";
import { loadHistory, saveHistory } from "./utils/history";
import { sendDiscordNotification } from "./utils/notify";

const config = configJson as Config;
const intervalMs = config.intervalMinutes * 60 * 1000;

async function checkForNewListings(): Promise<void> {
  const history = loadHistory();

  for (let i = 0; i < history.length; i += 1) {
    const now = new Date().toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    });
    const url = config.urls[i];
    if (!url) continue;

    const [city, data] = await crawlOnePage(url);
    const oldLinks = history[i]?.map((item) => item.link) || [];
    const newItems = data.filter((item) => !oldLinks.includes(item.link));

    if (newItems.length > 0) {
      if (oldLinks.length === 0) {
        history[i] = data;
        continue;
      }

      console.log(`[${now}] ${city} 新增 ${newItems.length} 筆新房源`);
      await sendDiscordNotification(newItems, city);
    } else {
      console.log(`[${now}] ${city} 沒有新資料`);
    }

    history[i] = data;
  }

  saveHistory(history);
}

setInterval(checkForNewListings, intervalMs);
void checkForNewListings();
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: pass.

- [ ] **Step 3: Run build**

Run:

```bash
pnpm build
```

Expected: pass and create `dist/index.js`, `dist/crawler/crawlOnePage.js`, `dist/utils/history.js`, `dist/utils/notify.js`, and `dist/types.js`.

- [ ] **Step 4: Commit entrypoint conversion**

Run:

```bash
git add src/index.ts
git commit -m "build: convert entrypoint to typescript"
```

Expected: commit contains only `src/index.ts`.

## Task 7: Remove JavaScript Sources

**Files:**
- Delete: `index.js`
- Delete: `crawler/crawlOnePage.js`
- Delete: `utils/history.js`
- Delete: `utils/notify.js`

- [ ] **Step 1: Delete old JavaScript source files**

Remove:

```text
index.js
crawler/crawlOnePage.js
utils/history.js
utils/notify.js
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: pass.

- [ ] **Step 3: Run build**

Run:

```bash
pnpm build
```

Expected: pass.

- [ ] **Step 4: Confirm compiled package entry exists**

Run:

```bash
test -f dist/index.js
```

Expected: command exits with status 0.

- [ ] **Step 5: Commit JavaScript source removal**

Run:

```bash
git add index.js crawler/crawlOnePage.js utils/history.js utils/notify.js
git commit -m "build: remove javascript sources"
```

Expected: commit records the deleted JavaScript files.

## Task 8: Final Verification

**Files:**
- No planned file edits.

- [ ] **Step 1: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: pass.

- [ ] **Step 2: Run build**

Run:

```bash
pnpm build
```

Expected: pass.

- [ ] **Step 3: Inspect git status**

Run:

```bash
git status --short
```

Expected: only pre-existing local changes remain, plus any intentionally uncommitted lockfile or generated-file changes from this migration. `dist/` should not appear because it is ignored.

- [ ] **Step 4: Report runtime caveat**

Do not run `pnpm start` automatically unless live-site verification is requested, because it contacts 591, opens Playwright, and starts an interval. Report that `pnpm start` is available after `pnpm build`.

## Self-Review Notes

- The plan covers the approved spec: CommonJS output, `src/` source root, `dist/` build output, shared types, preserved root `config.json`, preserved root `591_data.json`, and current scraper behavior.
- The plan does not introduce ESM, a test framework, package-manager changes, scraper logic redesign, or Discord format changes.
- Type names are consistent across tasks: `Listing`, `History`, and `Config`.
