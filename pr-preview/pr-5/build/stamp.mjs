// Writes assets/VERSION with the stejar commit the CSS was built against.
// Run after `npm run build:css` (or use it in a combined script).
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

let sha = "unknown";
try {
  sha = sh("git -C ../stejar rev-parse --short HEAD");
} catch {
  console.warn("stamp: could not read ../stejar HEAD — is the stejar repo checked out as a sibling?");
}

const stamp = `stejar ${sha}\nbuilt ${new Date().toISOString()}\n`;
writeFileSync(new URL("../assets/VERSION", import.meta.url), stamp);
console.log("stamp: assets/VERSION ->", stamp.replace(/\n/g, " "));
