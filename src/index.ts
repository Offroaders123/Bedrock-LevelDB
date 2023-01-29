import * as fs from "node:fs/promises";
import { LevelDB } from "leveldb-zlib";

const db = new LevelDB("../test/My World/db/");

await db.open();

const iterator = db.getIterator();

for await (const key of iterator){
  console.log(key);
}