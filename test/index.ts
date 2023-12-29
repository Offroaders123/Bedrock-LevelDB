import { fileURLToPath } from "node:url";
import { LevelChunkMetaDataDictionary, readDatabase } from "../src/index.js";

const WORLD = fileURLToPath(new URL("../test/world/dOCMZTQ2AAA=/db",import.meta.url));

const data = await readDatabase(WORLD);
console.log(data.LevelChunkMetaDataDictionary);

for (const entry of (data.LevelChunkMetaDataDictionary as LevelChunkMetaDataDictionary).entries){
  console.log(entry.tag.data);
}