import { fileURLToPath } from "node:url";
import { LevelChunkMetaDataDictionary, readDatabase } from "../src/index.js";

const WORLD = fileURLToPath(new URL("../test/world/dOCMZTQ2AAA=/db",import.meta.url));

const data = await readDatabase(WORLD);

// Object.keys(data).forEach(key => console.log(key));

const dictionaryKeys = (data.LevelChunkMetaDataDictionary as LevelChunkMetaDataDictionary).entries
  .map(entry => [
    entry.key,
    entry.key.join(" "),
    entry.key.toString("utf-8"),
    entry.key.toString("ascii"),
    entry.key.toString("utf-16le"),
    entry.key.readBigInt64BE(0),
    entry.key.readBigInt64LE(0),
    entry.key.readBigUInt64BE(0),
    entry.key.readBigUInt64LE(0)
  ]);
console.log(dictionaryKeys);

// for (const key of Object.entries(data)
//   .filter(entry => entry[0].match(/^digp/))
//   .map(entry => entry[0])
// ){
//   // console.log(key);
//   for (const dictionaryKey of dictionaryKeys){
//     if (!key.includes(dictionaryKey)) continue;
//     console.log(key);
//   }
// }