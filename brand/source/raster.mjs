// Turns the SVG files listed in a jobs file into PNGs of an exact size.
// Uses the `sharp` package that the website already depends on.
import fs from "node:fs";
import sharp from "sharp";

const jobs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
for (const job of jobs) {
  await sharp(fs.readFileSync(job.svg), { density: 72 })
    .resize(job.w, job.h, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toFile(job.png);
}
console.log(`rasterised ${jobs.length} files`);
