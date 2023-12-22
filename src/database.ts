import { LevelDB } from "leveldb-zlib";
import { readEntry, Dimension } from "./entry.js";

import type { WorldKey, SuffixKey, ChunkKey, Value } from "./entry.js";

declare module "leveldb-zlib" {
  export class LevelDB {
    [Symbol.asyncIterator](): ReturnType<Iterator[typeof Symbol.asyncIterator]>;
  }

  export class Iterator {
    [Symbol.asyncIterator](): AsyncGenerator<[Buffer, Buffer], void, void>;
  }
}

export type Entries = {
  overworld: Chunk[];
  nether: Chunk[];
  end: Chunk[];
} & {
  [K in WorldKey | `${SuffixKey["type"]}${string}`]?: Value;
}

export type Chunk = {
  x: number;
  y: number;
} & {
  [K in ChunkKey["type"]]?: Value;
}

export async function readDatabase(path: string): Promise<Entries> {
  const db = new LevelDB(path);
  await db.open();

  const entries: Entries = {
    overworld: [],
    nether: [],
    end: [],
  };

  for await (const entry of db.getIterator()){
    const result = await readEntry(entry);
    // console.log(result);

    const [key, value] = result;

    if (typeof key !== "object"){
      entries[key] = value;
      continue;
    }

    if (!("x" in key) || !("y" in key)){
      // entries[key.key.toString() as `${SuffixKey["type"]}${string}`] = value;
      continue;
    }

    const { x, y, type, dimension } = key;
    let chunk: Chunk | undefined = entries[Dimension[dimension] as keyof typeof Dimension].find(entry => entry.x === x && entry.y === y);

    if (chunk === undefined){
      chunk = { x, y };
      entries[Dimension[dimension] as keyof typeof Dimension].push(chunk);
    }

    chunk[type] = value;
  }

  await db.close();

  // delete entries.overworld;

  return entries;
}