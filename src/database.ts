import { LevelDB } from "leveldb-zlib";
import { KEY } from "./key.js";

declare module "leveldb-zlib" {
  export class LevelDB {
    [Symbol.asyncIterator](): AsyncGenerator<[Buffer,Buffer],void,void>;
  }
}

export type Chunk = {
  -readonly [K in keyof typeof KEY]: Buffer;
} & {
  x: number;
  y: number;
};

export type Entries = Chunk[];

export async function readDatabase(path: string): Promise<Entries> {
  const db = new LevelDB(path);
  await db.open();

  const entries: Entries = [];

  for await (const [key,value] of db){
    const { x, y, type } = readKey(key);
    if (!entries.some(entry => entry.x === x && entry.y === y)){
      entries.push({ x, y } as Chunk);
    }
    entries.find(entry => entry.x === x && entry.y === y)![type] = value;
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
  const y = view.getInt32(3,true);
  const type = KEY[view.getUint8(8) as KEY] as keyof typeof KEY;
  return { x, y, type };
}