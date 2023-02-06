import * as fs from "node:fs/promises";
import type { LevelDB } from "leveldb-zlib";
import * as NBT from "nbtify";

export type KEY = keyof typeof KEY;

export const KEY = {
  43: "Data3D",
  44: "Version",
  45: "Data2D",
  46: "Data2DLegacy",
  47: "SubChunkPrefix",
  48: "LegacyTerrain",
  49: "BlockEntity",
  50: "Entity",
  51: "PendingTicks",
  52: "LegacyBlockExtraData",
  53: "BiomeState",
  54: "FinalizedState",
  55: "ConversionData",
  56: "BorderBlocks",
  57: "HardcodedSpawners",
  58: "RandomTicks",
  59: "CheckSums",
  60: "GenerationSeed",
  61: "GeneratedPreCavesAndCliffsBlending",
  62: "BlendingBiomeHeight",
  63: "MetaDataHash",
  64: "BlendingData",
  65: "ActorDigestVersion",
  118: "LegacyVersion"
} as const;

export async function read(db: LevelDB) {
  const result: Record<string,any> = {};

  for await (const [key,value] of db){
    try {
      // result[key] = 
      await NBT.read(value,{
        endian: "little",
        compression: null,
        isNamed: true,
        isBedrockLevel: false
      }).then(({ data }) => data);
    } catch {
      // result[key] = value;
      // console.log(key.join(" "));

      const view = new DataView(key.buffer,key.byteOffset,key.byteLength);
      const x = view.getInt32(0,true);
      const y = view.getInt32(3,true);
      const type = view.getUint8(8) as KEY;
      const index = (type === 47) ? view.getUint8(9) : "";
      console.log(x,y,KEY[type],index);
    }
  }

  return result;
}