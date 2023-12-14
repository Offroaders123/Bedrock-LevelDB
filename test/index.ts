import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { read, stringify } from "nbtify";
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

// const blockEntities: RootTag[][] = await Promise.all(
//   blockEntityActors
//     // .map(blockEntity => blockEntity.join(" "))
//     .map(blockEntity => parseBlockEntityActor(blockEntity))
// );
// console.log(blockEntities);

const demo: Buffer = blockEntityActors[2]!;
console.log(demo);

const blockEntities: string = (await parseBlockEntityActor(blockEntityActors[2]!))
  .map(root => stringify(root,{ space: 2 }))
  .join(",\n\n");
console.log(blockEntities);

await writeFile(new URL("./BlockEntity.bin",import.meta.url),blockEntities);

export async function parseBlockEntityActor(blockEntity: Uint8Array): Promise<RootTag[]> {
      const blockEntities: RootTag[] = [];
      let byteOffsets: number[] = [];
      let trailingBytes: Uint8Array;

      for (let i = 0; i < blockEntity.byteLength; i++){
        try {
          const { data } = await read(blockEntity.subarray(i),{ ...FORMAT, strict: false } satisfies Required<ReadOptions>);
          blockEntities.push(data);
          byteOffsets.push(i);
        } catch {}
      }
      trailingBytes = blockEntity.subarray(byteOffsets.at(-1) ?? 0);

      console.log(byteOffsets);
      console.log(trailingBytes
        // .join(" ")
      );
      return blockEntities;
}