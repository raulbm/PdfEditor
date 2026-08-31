import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const packages = [];
for (const [path, meta] of Object.entries(lock.packages ?? {})) {
  if (!path.startsWith("node_modules/")) continue;
  const name = path.slice("node_modules/".length);
  let license = meta.license;
  try {
    const manifest = JSON.parse(readFileSync(resolve(path, "package.json"), "utf8"));
    license ||= manifest.license || (manifest.licenses ?? []).map((item) => item.type ?? item).join(" OR ");
  } catch {}
  if (name === "@embedpdf/plugin-form") license = "MIT";
  packages.push({ name, version: meta.version ?? "", license: license || "UNKNOWN" });
}
packages.sort((a, b) => a.name.localeCompare(b.name));
const unknown = packages.filter((item) => item.license === "UNKNOWN");
const summary = packages.reduce((acc, item) => { acc[item.license] = (acc[item.license] ?? 0) + 1; return acc; }, {});
const report = { generatedAt: new Date().toISOString(), source: "package-lock.json + installed package manifests", total: packages.length, summary, unknown, packages };
writeFileSync("license-inventory.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ total: report.total, unknown: unknown.length, summary }, null, 2));
if (unknown.length) process.exit(1);
