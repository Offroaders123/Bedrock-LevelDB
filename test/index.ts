import { fileURLToPath } from "node:url";
import { readDatabase } from "../src/index.js";

const WORLD = fileURLToPath(new URL("../test/world/My World/db",import.meta.url));

const data = await readDatabase(WORLD);

for (const key of data) {
  if (typeof key === "object" && "x" in key && "y" in key) continue;
  console.log(key);
}