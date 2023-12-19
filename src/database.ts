import { LevelDB } from "leveldb-zlib";
import { readEntry } from "./entry.js";

declare module "leveldb-zlib" {
  export class LevelDB {
    [Symbol.asyncIterator](): ReturnType<Iterator[typeof Symbol.asyncIterator]>;
  }

  export class Iterator {
    [Symbol.asyncIterator](): AsyncGenerator<[Buffer, Buffer], void, void>;
  }
}

export interface Entries {
  chunks: Chunk[];
  [entry: string]: any;
}

export interface Chunk {
  x: number;
  y: number;
  [entry: string]: any;
}

export async function readDatabase(path: string): Promise<Entries> {
  const db = new LevelDB(path);
  await db.open();

  const entries: Entries = {
    chunks: []
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
      entries[key.key.toString()] = value;
      continue;
    }

    const { type, x, y } = key;
    let chunk: Chunk | undefined = entries.chunks.find(entry => entry.x === x && entry.y === y);

    if (chunk === undefined){
      chunk = { x, y };
      entries.chunks.push(chunk);
    }

    chunk[type] = value;
  }

  await db.close();

  return entries;
}