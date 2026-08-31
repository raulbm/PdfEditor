#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const input = process.argv[2] ?? "tmp-structural-poc.pdf";
const output = process.argv[3] ?? "tmp-liteparse-verification.json";
if (!existsSync(input)) throw new Error(`Input PDF not found: ${input}`);
const result = spawnSync("lit", ["parse", input, "--format", "json", "--no-ocr", "-o", output], { stdio: "inherit", shell: process.platform === "win32" });
if (result.status !== 0) process.exit(result.status ?? 1);
const parsed = JSON.parse(readFileSync(output, "utf8"));
if (!Array.isArray(parsed.pages) || parsed.pages.length === 0) throw new Error("LiteParse returned no pages");
const withText = parsed.pages.filter((page) => Array.isArray(page.textItems) && page.textItems.length > 0);
if (withText.length === 0) throw new Error("LiteParse returned no spatial text items");
console.log(JSON.stringify({ pages: parsed.pages.length, pagesWithTextItems: withText.length, output }, null, 2));
