import { fileURLToPath } from "node:url";
import { BlockEntities, readDatabase } from "../src/index.js";

const WORLD = fileURLToPath(new URL("../test/world/My World/db",import.meta.url));

const data = await readDatabase(WORLD);
console.log(data.overworld.map(chunk => (chunk.BlockEntity as BlockEntities | undefined)?.map(entity => entity.data)));