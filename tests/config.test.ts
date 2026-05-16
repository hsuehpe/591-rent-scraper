import assert from "node:assert/strict";
import { parseConfig } from "../src/config";

const validConfig = {
  urls: ["https://rent.591.com.tw/list?region=1"],
  intervalMinutes: 10,
  fetchCount: 30,
};

assert.deepEqual(parseConfig(validConfig), validConfig);

assert.throws(
  () => parseConfig({ ...validConfig, urls: [] }),
  /urls must contain at least one URL/,
);

assert.throws(
  () => parseConfig({ ...validConfig, urls: [""] }),
  /urls\[0\] must be a non-empty string/,
);

assert.throws(
  () => parseConfig({ ...validConfig, intervalMinutes: 0 }),
  /intervalMinutes must be a positive number/,
);

assert.throws(
  () => parseConfig({ ...validConfig, fetchCount: 1.5 }),
  /fetchCount must be a positive integer/,
);
