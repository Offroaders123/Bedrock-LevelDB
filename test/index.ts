import { fileURLToPath } from "node:url";
import { read } from "nbtify";
import { readDatabase } from "../src/index.js";

import type { NBTData } from "nbtify";

const WORLD = fileURLToPath(new URL("../test/My World/db",import.meta.url));

const data = await readDatabase(WORLD);
const blockEntityActors: Buffer[] = data.chunks
  .map(chunk => chunk.BlockEntity)
  .filter((blockEntity): blockEntity is Buffer => blockEntity !== undefined);

const blockEntities: NBTData[][] = await Promise.all(
  blockEntityActors
    // .map(blockEntity => blockEntity.join(" "))
    .map(async (blockEntity): Promise<NBTData[]> => {
      const { data } = await read(blockEntity,{ endian: "little", strict: false });
      return data;
    })
);
console.log(blockEntities);