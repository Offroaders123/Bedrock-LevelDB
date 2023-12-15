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

export async function readDatabase(path: string): Promise<void> {
  const db = new LevelDB(path);
  await db.open();

  for await (const entry of db.getIterator()){
    const result = await readEntry(entry);
    console.log(result);
  }

  await db.close();
}