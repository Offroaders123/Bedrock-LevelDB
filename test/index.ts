import { fileURLToPath } from "node:url";
import { readDatabase } from "../src/index.js";

const WORLD = fileURLToPath(new URL("../test/world/Survival of the Fittest 2017-9-26/db",import.meta.url));

const data = await readDatabase(WORLD);
console.log(data);