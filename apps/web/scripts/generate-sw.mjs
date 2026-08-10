import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "out");
const publicSw = join(root, "public", "sw.js");
const outputSw = join(outDir, "sw.js");

async function collect(dir) {
  const files = [];
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) {
      files.push(...(await collect(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

const files = (await collect(outDir)).filter((f) => !f.endsWith("sw.js"));
const precache = files
  .map((f) => "/" + relative(outDir, f).split(sep).join("/"))
  .sort();

const hash = createHash("sha1").update(precache.join("\n")).digest("hex").slice(0, 8);
const version = `v1-${hash}`;

const template = await readFile(publicSw, "utf8");
const sw = template
  .replace("__VERSION__", version)
  .replace(
    "const PRECACHE = /*__PRECACHE__*/ [];",
    `const PRECACHE = ${JSON.stringify(precache)};`,
  );

await writeFile(outputSw, sw);
console.log(`service worker generated: ${version} (${precache.length} files precached)`);
