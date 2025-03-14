import { readEntry } from "./entry.js";

import type { Key } from "../Region-Types/dist/bedrock/index.js";

// not sure about the indexing here yet, still messy with these fancy types now
export async function readDatabase(path: string): Promise<Key[]> {
  const db = new LevelDB(path,{ createIfMissing: false });
  await db.open();

  const entries: Key[] = [];

  // for await (const [keyBuffer] of db.getIterator({ keys: true, values: false })){
  //   const key = (await import("./entry.js")).readKey(keyBuffer);
  //   console.log(key);
  // }

  // for await (const entry of (db.getIterator() as AsyncIterable<[Buffer, Buffer]>)){
  //   const result = await readEntry(entry);
  //   // console.log(result);

  //   const [key, value] = result;

  //   if (typeof key !== "object"){
  //     entries[key] = value as any;
  //     // console.log(key,value);
  //     continue;
  //   }

  //   // continue;

  //   if (!("x" in key) || !("y" in key)){
  //     entries[key.key.toString() as `${keyof SuffixKeyNameMap}${string}`] = value as any;
  //     continue;
  //   }

  //   const { x, y, type, dimension, subchunk } = key;
  //   let chunk: Chunk | undefined = entries[DimensionID[dimension] as keyof typeof DimensionID].find(entry => entry.x === x && entry.y === y);

  //   if (chunk === undefined){
  //     chunk = { x, y, subchunks: [] };
  //     entries[DimensionID[dimension] as keyof typeof DimensionID].push(chunk);
  //   }

  //   if (type === "SubChunkPrefix"){
  //     chunk.subchunks[subchunk!] = value as Buffer;
  //     continue;
  //   }
    
  //   chunk[type] = value as any;
  // }

  for await (const entry of (db.getIterator() as AsyncIterable<[Buffer, Buffer]>)){
    const result = await readEntry(entry);
    // console.log(result);
    entries.push(result);
  }

  await db.close();

  return entries;
}