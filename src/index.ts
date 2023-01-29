import * as fs from "node:fs/promises";
import { LevelDB } from "leveldb-zlib";
import * as NBT from "nbtify";

const db = new LevelDB("../test/My World/db/");

await db.open();

const data = await read(db);
console.log(data);

await db.close();

async function read(db: LevelDB) {
  const result: Record<string,any> = {};

  for await (const [key,value] of db){
    result[key] = value;
  }

  return result;
}