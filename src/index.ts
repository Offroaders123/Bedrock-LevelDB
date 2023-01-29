import * as fs from "node:fs/promises";
import { LevelDB } from "leveldb-zlib";
import * as NBT from "nbtify";

const db = new LevelDB("../test/My World/db/");

await db.open();

const keys = await getKeys(db);
console.log(keys);

await db.close();

async function getKeys(db: LevelDB) {
  const keys: any[] = [];

  for await (const key of db){
    keys.push(key);
  }

  return Object.fromEntries(keys);
}