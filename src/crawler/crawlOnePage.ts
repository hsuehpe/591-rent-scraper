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
