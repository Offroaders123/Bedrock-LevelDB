import { LevelDB } from "leveldb-zlib";
import { read } from "nbtify";
import { KEY } from "./key.js";

declare module "leveldb-zlib" {
  export class LevelDB {
    [Symbol.asyncIterator](): AsyncGenerator<[Buffer,Buffer],void,void>;
  }
}

export type Chunk = {
  -readonly [K in keyof typeof KEY]?: Buffer;
} & {
  x: number;
  y: number;
};

export interface Entries {
  chunks: Chunk[];
}

export async function readDatabase(path: string): Promise<Entries> {
  const db = new LevelDB(path);
  await db.open();

  const entries: Entries = {
    chunks: []
  };

  for await (const [key,value] of db){
    const { x, y, type } = readKey(key);

    if (!(type in KEY)){
      try {
        const data = await read(value,{
          endian: "little",
          compression: null,
          name: true,
          bedrockLevel: false
        });
        // @ts-expect-error - untyped indexing
        entries[type] = data;
      } catch {
        // @ts-expect-error - untyped indexing
        entries[type] = value;
      }  
      continue;
    }

    if (!entries.chunks.some(entry => entry.x === x && entry.y === y)){
      entries.chunks.push({ x, y } as Chunk);
    }
    entries.chunks.find(entry => entry.x === x && entry.y === y)![type] = value;
  }

  await db.close();
  return entries;
}

export interface Key {
  x: number;
  y: number;
  type: keyof typeof KEY;
}

export function readKey(key: Buffer): Key {
  const view = new DataView(key.buffer,key.byteOffset,key.byteLength);
  const x = view.getInt32(0,true);
  const y = view.getInt32(4,true);
  let type = KEY[view.getUint8(8) as KEY] as keyof typeof KEY;
  if (!(type in KEY)) type = key.toString("utf-8") as keyof typeof KEY;
  return { x, y, type };
}