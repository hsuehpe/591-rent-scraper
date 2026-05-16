import assert from "node:assert/strict";
import { extractCityFromTitle } from "../src/crawler/cityParser";

assert.equal(
  extractCityFromTitle("台北市北投區整層住家出租 - 591租屋網"),
  "台北市",
);

assert.equal(extractCityFromTitle("【新北市出租】-591房屋交易網"), "新北市");
