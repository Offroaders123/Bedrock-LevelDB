import { readFile } from "node:fs/promises";
// import { fileURLToPath } from "node:url";
import { read, stringify } from "nbtify";
// import { readDatabase } from "../src/index.js";

import type { RootTag, ReadOptions } from "nbtify";

const FORMAT: Required<ReadOptions> = {
  name: "",
  endian: "little",
  compression: null,
  bedrockLevel: null,
  strict: true
};

// const WORLD = fileURLToPath(new URL("../test/My World/db",import.meta.url));

// const data = await readDatabase(WORLD);
// const blockEntityActors: Buffer[] = data.chunks
//   .map(chunk => chunk.BlockEntity)
//   .filter((blockEntity): blockEntity is Buffer => blockEntity !== undefined);

const DEMO = new URL("./BlockEntity.bin",import.meta.url);

const demo: Buffer =
  // blockEntityActors[2]!;
  await readFile(DEMO);

const ids: string[] = demo.toString("utf-8").split("id").map(id => id.split("\x01")?.[0]?.split("\x00")[1]?.replace(/\W/g,"") ?? "").filter(string => /^[A-Z]/g.test(string));
console.log(ids);

const blockEntities: RootTag[] = await parseBlockEntityActor(demo);
console.log(blockEntities
  .filter(blockEntity => "id" in blockEntity)
  // .map(blockEntity => stringify(blockEntity,{ space: 2 }))
  // .join(",\n\n")
);

export async function parseBlockEntityActor(data: Uint8Array): Promise<RootTag[]> {
  const blockEntities: RootTag[] = [];

  // for (let i = 0; i < 9; i++){
  while (true){
    try {
      const blockEntity: RootTag = await read(data,FORMAT).then(data => data.data);
      blockEntities.push(blockEntity);
      console.log("end!");
      break;
    } catch (error){
      const message: string = (error as Error).message ?? `${error}`;
      console.log(message);
      const length: number = parseInt(message.slice(46));
      console.log(length);
      const blockEntity: RootTag = await read(data,{ ...FORMAT, strict: false }).then(data => data.data);
      blockEntities.push(blockEntity);
      data = data.subarray(length);
    }
  }

  return blockEntities;
}