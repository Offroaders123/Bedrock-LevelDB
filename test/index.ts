import { fileURLToPath } from "node:url";
import { readDatabase } from "../src/index.js";

const WORLD = fileURLToPath(new URL("../test/world/Chromebook Survival/db",import.meta.url));

const data = await readDatabase(WORLD);
console.log(data);