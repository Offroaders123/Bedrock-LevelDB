import { fileURLToPath } from "node:url";
import { LevelChunkMetaDataDictionary, readDatabase } from "../src/index.js";

const WORLD = fileURLToPath(new URL("../test/world/dOCMZTQ2AAA=/db",import.meta.url));

const data = await readDatabase(WORLD);

// Object.keys(data).forEach(key => console.log(key));

const dictionaryKeys: string[] = (data.LevelChunkMetaDataDictionary as LevelChunkMetaDataDictionary).entries
  .map(entry => entry.key.toString());
console.log(dictionaryKeys);

for (const key of Object.entries(data)
  .filter(entry => entry[0].match(/^digp/))
  .map(entry => entry[0])
){
  // console.log(key);
  for (const dictionaryKey of dictionaryKeys){
    if (!key.includes(dictionaryKey)) continue;
    console.log(key);
  }
}