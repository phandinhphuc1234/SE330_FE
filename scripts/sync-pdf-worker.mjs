import { copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
// PDF.js API and worker versions must always match, including Vercel builds.
const source = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs");
const { version } = require("pdfjs-dist/package.json");
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("Unexpected PDF.js version.");
const destination = fileURLToPath(new URL(`../public/pdf.worker-${version}.min.mjs`, import.meta.url));
copyFileSync(source, destination);
console.log(`Synchronized versioned PDF.js worker ${version}; legacy worker retained.`);
