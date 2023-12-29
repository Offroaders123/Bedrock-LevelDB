import { fileURLToPath } from "node:url";
import { readDatabase } from "../src/index.js";
import { read } from "nbtify";

const WORLD = fileURLToPath(new URL("../test/world/dOCMZTQ2AAA=/db",import.meta.url));

const data = await readDatabase(WORLD);
// Object.entries(data)
//   .filter(([key]) => !/(^overworld|nether|end$)|(^actorprefix|digp)/.test(key))
//   .forEach(([key,value]) => console.log(key))//,value.data ?? value));

// console.log(data.BiomeData.data);
// console.log(data.Overworld.data);
// console.log(data.Nether.data);
// console.log(data.TheEnd.data);

console.log(data.LevelChunkMetaDataDictionary);
console.log(await read((data.LevelChunkMetaDataDictionary as Buffer).subarray(12),{ name: true, strict: false }));