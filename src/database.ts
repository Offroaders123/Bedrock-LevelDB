import { LevelDB } from "leveldb-zlib";

export interface Entries {
  [key: string]: Buffer;
}

export async function readDatabase(path: string): Promise<Entries> {
  const db = new LevelDB(path);
  await db.open();

  const entries: Entries = {};

  for await (const [key,value] of db){
    entries[(key as Buffer).toString("hex")] = value;
  }

  await db.close();
  return entries;
}