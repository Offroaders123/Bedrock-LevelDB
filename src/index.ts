import * as fs from "node:fs/promises";
import { LevelDB } from "leveldb-zlib";

const db = new LevelDB("../test/My World/db/");

await db.open();

for await (const key of db){
  console.log((key as Buffer[]).map(buffer => buffer.toString()),"\n");
}

await db.close();