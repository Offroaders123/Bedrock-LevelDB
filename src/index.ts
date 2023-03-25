import * as fs from "node:fs/promises";
import type { LevelUp } from "levelup";
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

export async function read(db: LevelUp<Uint8Array,Uint8Array>) {
  const result: Record<string,any> = {};

  for await (const entry of db.iterator()){
    console.log(entry);continue;
  }

  return result;
}