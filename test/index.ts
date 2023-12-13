import { fileURLToPath } from "node:url";
import { read } from "nbtify";
import { readDatabase } from "../src/index.js";

const WORLD = fileURLToPath(new URL("../test/My World/db",import.meta.url));

const data = await readDatabase(WORLD);
console.log(await Promise.all(
  data.chunks
    .map(chunk => chunk.BlockEntity)
    .filter(blockEntity => blockEntity !== undefined)
    // .map(blockEntity => blockEntity.join(" "))
    .map(async blockEntity => (await read(blockEntity,{ endian: "little", strict: false })).data)
));