import { fileURLToPath } from "node:url";
import { readDatabase } from "../src/index.js";

const WORLD = fileURLToPath(new URL("../test/world/Valkyrins 2.0 2021-7-5/db",import.meta.url));

const data = await readDatabase(WORLD);
console.log(data);