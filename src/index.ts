import * as fs from "node:fs/promises";
import type { LevelDB } from "leveldb-zlib";
import * as NBT from "nbtify";

export enum KEY {
  Data3D = 43,
  Version = 44,
  Data2D = 45,
  Data2DLegacy = 46,
  SubChunkPrefix = 47,
  LegacyTerrain = 48,
  BlockEntity = 49,
  Entity = 50,
  PendingTicks = 51,
  LegacyBlockExtraData = 52,
  BiomeState = 53,
  FinalizedState = 54,
  ConversionData = 55,
  BorderBlocks = 56,
  HardcodedSpawners = 57,
  RandomTicks = 58,
  CheckSums = 59,
  GenerationSeed = 60,
  GeneratedPreCavesAndCliffsBlending = 61,
  BlendingBiomeHeight = 62,
  MetaDataHash = 63,
  BlendingData = 64,
  ActorDigestVersion = 65,
  LegacyVersion = 118
}

export async function read(db: LevelDB) {
  const result: Record<string,any> = {};

  for await (const [key,value] of db){
    const view = new DataView(key.buffer,key.byteOffset,key.byteLength);
    const x = view.getInt32(0,true);
    const y = view.getInt32(3,true);
    const type = view.getUint8(8) as KEY;
    // const index = (type === 47) ? view.getUint8(9) : "";
    // console.log(x,y,KEY[type],index);
    // console.log(value,"\n");

    const entry = (type in KEY) ? `${x},${y}: ${KEY[type]}` : key.toString();

    try {
      result[entry] = await NBT.read(value,{
        endian: "little",
        compression: null,
        isNamed: true,
        isBedrockLevel: false
      }).then(({ data }) => data);
    } catch {
      result[entry] = value;
    }
  }

  return result;
}