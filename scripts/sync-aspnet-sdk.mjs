import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("packages/web-component/dist");
const destinationDirectory = resolve("examples/aspnet/wwwroot/sdk");
const structuralSource = resolve("packages/engine-structural/dist-browser");

await rm(destinationDirectory, { recursive: true, force: true });
await mkdir(destinationDirectory, { recursive: true });
await cp(source, destinationDirectory, { recursive: true });
await cp(structuralSource, resolve(destinationDirectory, "structural"), { recursive: true });

