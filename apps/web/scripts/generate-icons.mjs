import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public", "icons");

const jobs = [
  { src: "icon.svg", out: "icon-192.png", size: 192 },
  { src: "icon.svg", out: "icon-512.png", size: 512 },
  { src: "icon-maskable.svg", out: "maskable-512.png", size: 512 },
  { src: "icon-maskable.svg", out: "apple-touch-icon.png", size: 180 },
];

for (const job of jobs) {
  await sharp(join(publicDir, job.src))
    .resize(job.size, job.size)
    .png()
    .toFile(join(publicDir, job.out));
  console.log(`generated ${job.out}`);
}
