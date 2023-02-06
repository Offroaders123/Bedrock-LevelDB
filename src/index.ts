import * as fs from "node:fs/promises";
import type { LevelDB } from "leveldb-zlib";
import * as NBT from "nbtify";

export type KEY = typeof KEY[keyof typeof KEY];

export const KEY = {
  Data3D: 43,
  ChunkVersion: 44,
  Data2D: 45,
  Data2DLegacy: 46,
  SubChunkPrefix: 47,
  LegacyTerrain: 48,
  BlockEntity: 49,
  Entity: 50,
  PendingTicks: 51,
  BlockExtraData: 52,
  BiomeState: 53,
  FinalizedState: 54,
  BorderBlocks: 56,
  HardCodedSpawnAreas: 57,
  RandomTicks: 58,
  Checksums: 59,
  LegacyChunkVersion: 118
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
      console.log(x,y,type,index);
    }
  }

  return result;
}