import * as fs from "node:fs/promises";
import { LevelDB } from "leveldb-zlib";
import * as NBT from "nbtify";

const db = new LevelDB("../test/My World/db/");

await db.open();

for await (const key of db){
  for (const thing of key){
    try {
      const nbt = await NBT.read(thing,{
        endian: "little",
        compression: null,
        isNamed: true,
        isBedrockLevel: false
      });
      console.log(nbt);
    } catch {}
  }
}

await db.close();