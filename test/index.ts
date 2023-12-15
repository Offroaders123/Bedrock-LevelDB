import { fileURLToPath } from "node:url";
import { read } from "nbtify";
import { readDatabase } from "../src/index.js";

import type { RootTag, ReadOptions } from "nbtify";

const FORMAT: Required<ReadOptions> = {
  name: "",
  endian: "little",
  compression: null,
  bedrockLevel: null,
  strict: true
};

const WORLD = fileURLToPath(new URL("../test/My World/db",import.meta.url));

const data = await readDatabase(WORLD);
const blockEntityActors: Buffer[] = data.chunks
  .map(chunk => chunk.BlockEntity)
  .filter((blockEntity): blockEntity is Buffer => blockEntity !== undefined);

const blockEntities: RootTag[][] = await Promise.all(
  blockEntityActors
    .map(blockEntity => parseBlockEntityActor(blockEntity))
);
console.log(blockEntities);

export async function parseBlockEntityActor(data: Uint8Array): Promise<RootTag[]> {
  const blockEntities: RootTag[] = [];

  while (true){
    try {
      const blockEntity: RootTag = await read(data,FORMAT).then(data => data.data);
      blockEntities.push(blockEntity);
      break;
    } catch (error){
      const message: string = (error as Error).message ?? `${error}`;
      const length: number = parseInt(message.slice(46));
      const blockEntity: RootTag = await read(data,{ ...FORMAT, strict: false }).then(data => data.data);
      blockEntities.push(blockEntity);
      data = data.subarray(length);
    }
  }

  return blockEntities;
}