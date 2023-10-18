import { fileURLToPath } from "node:url";
import { readDatabase } from "../src/index.js";

const WORLD = fileURLToPath(new URL("../test/My World/db",import.meta.url));

const data = await readDatabase(WORLD);
console.log(data);