import { LevelDB } from "leveldb-zlib";
import { readEntry, Dimension, readKey } from "./entry.js";

import type { WorldKey, SuffixKey, ChunkKey, Value } from "./entry.js";

declare module "leveldb-zlib" {
  // @ts-ignore
  export class LevelDB {
    [Symbol.asyncIterator](): ReturnType<Iterator[typeof Symbol.asyncIterator]>;
  }

  // @ts-ignore
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
  subchunks: Buffer[];
} & {
  [K in ChunkKey["type"]]?: Value;
}

export async function readDatabase(path: string): Promise<Entries> {
  const db = new LevelDB(path,{ createIfMissing: false });
  await db.open();

  const entries: Entries = {
    overworld: [],
    nether: [],
    end: [],
  };

  // for await (const [keyBuffer] of db.getIterator({ keys: true, values: false })){
  //   const key = readKey(keyBuffer);
  //   console.log(key);
  // }

  for await (const entry of db.getIterator()){
    const result = await readEntry(entry);
    // console.log(result);

    const [key, value] = result;

    if (typeof key !== "object"){
      entries[key] = value;
      // console.log(key,value);
      continue;
    }

    // continue;

    if (!("x" in key) || !("y" in key)){
      entries[key.key.toString() as `${SuffixKey["type"]}${string}`] = value;
      continue;
    }

    const { x, y, type, dimension, subchunk } = key;
    let chunk: Chunk | undefined = entries[Dimension[dimension] as keyof typeof Dimension].find(entry => entry.x === x && entry.y === y);

    if (chunk === undefined){
      chunk = { x, y, subchunks: [] };
      entries[Dimension[dimension] as keyof typeof Dimension].push(chunk);
    }

    if (type === "SubChunkPrefix"){
      chunk.subchunks[subchunk!] = value as Buffer;
      continue;
    }
    
    chunk[type] = value;
  }

  await db.close();

  return entries;
}