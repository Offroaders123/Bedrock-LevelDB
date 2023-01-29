import * as fs from "node:fs/promises";
import { LevelDB } from "leveldb-zlib";
import * as NBT from "nbtify";

const db = new LevelDB(decodeURI(new URL("../test/My World/db/",import.meta.url).pathname));

await db.open();

const data = await read(db);
console.log(data);

await db.close();

async function read(db: LevelDB) {
  const result: Record<string,any> = {};

  for await (const [key,value] of db){
    try {
      result[key] = await NBT.read(value,{
        endian: "little",
        compression: null,
        isNamed: true,
        isBedrockLevel: false
      }).then(({ data }) => data);
    } catch {
      result[key] = value;
    }
  }

  return result;
}