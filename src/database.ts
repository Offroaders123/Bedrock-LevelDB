import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { readEntry } from "./entry.js";
import LevelDb from "./ldb/minecraft/LevelDb.js";

import type { Key } from "../Region-Types/dist/bedrock/index.js";
import type LevelKeyValue from "./ldb/minecraft/LevelKeyValue.js";
import type IFile from "./ldb/storage/IFile.js";

async function _readDBFolder(path: string): Promise<[string, Promise<Uint8Array>][]> {
  const files: string[] = await readdir(path, { recursive: true });
  console.log(files);
  const entries: [string, Promise<Buffer>][] = files
    .map(file => [file, readFile(join(path, file))]);
  return entries;
}

async function _openLevelDB(path: string): Promise<LevelDb> {
  let fileEntries: [string, Promise<Uint8Array>][] = await _readDBFolder(path);

  let files: IFile[] = await Promise.all(fileEntries.map(async entry => {
    let iFile: IFile = {
      content: await entry[1],
      loadContent: async () => new Date(),
      name: entry[0],
      storageRelativePath: entry[0],
      fullPath: entry[0]
    };
    return iFile;
    // return new Proxy(iFile, {
    // 	get(target, prop, receiver) {
    // 		console.log(`Property accessed: ${String(prop)}`);
    // 		props.add(prop);
    // 		return Reflect.get(target, prop, receiver);
    // 	}
    // });
  }));
  
  let ldbFileArr: IFile[] = [];
  let logFileArr: IFile[] = [];
  let manifestFileArr: IFile[] = [];
  files.forEach(file => {
    if(file.name.startsWith("MANIFEST")) {
      manifestFileArr.push(file);
    } else if(file.name.endsWith("ldb")) {
      ldbFileArr.push(file);
    } else if(file.name.endsWith("log")) {
      logFileArr.push(file);
    }
  });

  let levelDb: LevelDb = new LevelDb(ldbFileArr, logFileArr, manifestFileArr, "LlamaStructureReader");
  await levelDb.init(async message => {
    console.log(`LevelDB: ${message}`);
  });
  return levelDb;
}

// not sure about the indexing here yet, still messy with these fancy types now
export async function readDatabase(path: string): Promise<Key[]> {
  const db: LevelDb = await _openLevelDB(path);
  // await db.open();

  const entries: Key[] = [];

  // for await (const [keyBuffer] of db.getIterator({ keys: true, values: false })){
  //   const key = (await import("./entry.js")).readKey(keyBuffer);
  //   console.log(key);
  // }

  // for await (const entry of (db.getIterator() as AsyncIterable<[Buffer, Buffer]>)){
  //   const result = await readEntry(entry);
  //   // console.log(result);

  //   const [key, value] = result;

  //   if (typeof key !== "object"){
  //     entries[key] = value as any;
  //     // console.log(key,value);
  //     continue;
  //   }

  //   // continue;

  //   if (!("x" in key) || !("y" in key)){
  //     entries[key.key.toString() as `${keyof SuffixKeyNameMap}${string}`] = value as any;
  //     continue;
  //   }

  //   const { x, y, type, dimension, subchunk } = key;
  //   let chunk: Chunk | undefined = entries[DimensionID[dimension] as keyof typeof DimensionID].find(entry => entry.x === x && entry.y === y);

  //   if (chunk === undefined){
  //     chunk = { x, y, subchunks: [] };
  //     entries[DimensionID[dimension] as keyof typeof DimensionID].push(chunk);
  //   }

  //   if (type === "SubChunkPrefix"){
  //     chunk.subchunks[subchunk!] = value as Buffer;
  //     continue;
  //   }
    
  //   chunk[type] = value as any;
  // }

  for (const entry of Object.entries(db.keys)){
    const key: Buffer = Buffer.from(entry[0]);
    const value: Buffer = typeof entry[1] === "object" ? Buffer.from(entry[1].value!) : Buffer.from([Number(entry[1]!)]);
    const result = await readEntry([key, value]).catch(() => null);
    if (result === null) {
      console.log("UNHANDLED KEY", key);
      continue;
    }
    // console.log(result);
    entries.push(result);
  }

  // await db.close();

  return entries;
}