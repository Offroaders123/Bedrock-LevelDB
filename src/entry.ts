import { read } from "nbtify";

import type { NBTData, ReadOptions, ByteTag, BooleanTag, IntTag, LongTag, FloatTag, StringTag } from "nbtify";

export async function readEntry(entry: [Buffer, Buffer]){
  const key = readKey(entry[0]);
  const value = await readValue(key,entry[1]);
  return [key,value];
}

export function readKey(key: Buffer): Key {
  const view = new DataView(key.buffer,key.byteOffset,key.byteLength);
  const type = view.getUint8(8);
  if (!(type in CHUNK_KEY)){
    const stringy: string = key.toString("utf-8");

    switch (true){
      case actorprefix.test(stringy):
        return { type: "actorprefix", key } satisfies SuffixKey;

      case digp.test(stringy):
        return { type: "digp", key } satisfies SuffixKey;

      case village_dwellers.test(stringy):
        return { type: "VILLAGE_DWELLERS", key } satisfies SuffixKey;

      case village_info.test(stringy):
        return { type: "VILLAGE_INFO", key } satisfies SuffixKey;

      case village_players.test(stringy):
        return { type: "VILLAGE_PLAYERS", key } satisfies SuffixKey;

      case village_poi.test(stringy):
        return { type: "VILLAGE_POI", key } satisfies SuffixKey;

      case map.test(stringy):
        return { type: "map", key } satisfies SuffixKey;

      default: return stringy as WorldKey;
    }
  }
  const x = view.getInt32(0,true);
  const y = view.getInt32(4,true);
  return { type: CHUNK_KEY[type]! as ChunkKey["type"], x, y } satisfies ChunkKey;
}

export async function readValue(key: Key, value: Buffer){
  if (typeof key === "string"){
    switch (key as WorldKey){
      case "AutonomousEntities": return read<AutonomousEntities>(value,format);
      case "BiomeData": return read<BiomeData>(value,format);
      case "game_flatworldlayers": return value;
      case "LevelChunkMetaDataDictionary": return value;
      case "~local_player": return read(value,format);
      case "mobevents": return read<MobEvents>(value,format);
      case "Overworld": return read(value,format);
      case "schedulerWT": return read<SchedulerWT>(value,format);
      case "scoreboard": return read<Scoreboard>(value,format);
      // default: return value;
    }
  } else {
    switch (key.type){
      // ChunkKey
      case "Data3D": return value;
      case "Version": return value.readInt8();
      case "Data2D": return value;
      case "Data2DLegacy": return value;
      case "SubChunkPrefix": return value.readInt8();
      case "LegacyTerrain": return value;
      case "BlockEntity": return readNBTList(value);
      case "Entity": return readNBTList(value);
      case "PendingTicks": return readNBTList(value);
      case "LegacyBlockExtraData": return { entries: value.readInt32LE(), entriesKey: value.readInt32LE(4), value: value.readInt16LE(8) };
      case "BiomeState": return value;
      case "FinalizedState": return value.readInt32LE();
      case "ConversionData": return value;
      case "BorderBlocks": return value;
      case "HardcodedSpawners": return value;
      case "RandomTicks": return readNBTList(value);
      case "CheckSums": return value;
      case "GenerationSeed": return value;
      case "GeneratedPreCavesAndCliffsBlending": return Boolean(value.readInt8());
      case "BlendingBiomeHeight": return value;
      case "MetaDataHash": return value;
      case "BlendingData": return value;
      case "ActorDigestVersion": return value.readInt8();
      case "LegacyVersion": return value.readInt8();

      // SuffixKey
      case "actorprefix": return read(value,format);
      case "digp": return value;
      case "VILLAGE_DWELLERS": return read<VillageDwellers>(value,format);
      case "VILLAGE_INFO": return read<VillageInfo>(value,format);
      case "VILLAGE_PLAYERS": return read<VillagePlayers>(value,format);
      case "VILLAGE_POI": return read<VillagePois>(value,format);
      case "map": return read<Map>(value,format);
      // default: return value;
    }
  }
}

export async function readNBTList(data: Uint8Array): Promise<NBTData[]> {
  const blockEntities: NBTData[] = [];

  while (true){
    if (data.byteLength === 0) break;
    try {
      const blockEntity: NBTData = await read(data,format);
      blockEntities.push(blockEntity);
      break;
    } catch (error){
      const message: string = (error as Error).message ?? `${error}`;
      const length: number = parseInt(message.slice(46));
      const blockEntity: NBTData = await read(data,{ ...format, strict: false });
      blockEntities.push(blockEntity);
      data = data.subarray(length);
    }
  }

  return blockEntities;
}

export const format: Required<ReadOptions> = {
  name: true,
  endian: "little",
  compression: null,
  bedrockLevel: false,
  strict: true
};

export type Key = WorldKey | SuffixKey | ChunkKey;

export type WorldKey = keyof typeof WORLD_KEY;

export enum WORLD_KEY {
  BiomeData = "BiomeData",
  LevelChunkMetaDataDictionary = "LevelChunkMetaDataDictionary",
  game_flatworldlayers = "game_flatworldlayers",
  "~local_player" = "~local_player",
  AutonomousEntities = "AutonomousEntities",
  Overworld = "Overworld",
  mobevents = "mobevents",
  schedulerWT = "schedulerWT",
  scoreboard = "scoreboard"
}

export interface SuffixKey {
  type: keyof typeof SUFFIX_KEY;
  key: Buffer;
}

export enum SUFFIX_KEY {
  actorprefix = "actorprefix",
  digp = "digp",
  VILLAGE_DWELLERS = "VILLAGE_DWELLERS",
  VILLAGE_INFO = "VILLAGE_INFO",
  VILLAGE_PLAYERS = "VILLAGE_PLAYERS",
  VILLAGE_POI = "VILLAGE_POI",
  map = "map"
}

export const actorprefix = /^actorprefix/;
export const digp = /^digp/;
export const village_dwellers = /VILLAGE_[0-9a-f\\-]+_DWELLERS/;
export const village_info = /VILLAGE_[0-9a-f\\-]+_INFO/;
export const village_players = /VILLAGE_[0-9a-f\\-]+_PLAYERS/;
export const village_poi = /VILLAGE_[0-9a-f\\-]+_POI/;
export const map = /map_\\-[0-9]+/;

export interface ChunkKey {
  type: keyof typeof CHUNK_KEY;
  x: number;
  y: number;
  dimension?: number;
}

export enum CHUNK_KEY {
  Data3D = 43,
  Version,
  Data2D,
  Data2DLegacy,
  SubChunkPrefix,
  LegacyTerrain,
  BlockEntity,
  Entity,
  PendingTicks,
  LegacyBlockExtraData,
  BiomeState,
  FinalizedState,
  ConversionData,
  BorderBlocks,
  HardcodedSpawners,
  RandomTicks,
  CheckSums,
  GenerationSeed,
  GeneratedPreCavesAndCliffsBlending,
  BlendingBiomeHeight,
  MetaDataHash,
  BlendingData,
  ActorDigestVersion,
  LegacyVersion = 118
}

export interface AutonomousEntities {
  AutonomousEntityList: unknown[];
}

export interface BiomeData {
  list: BiomeDataList[];
}

export interface BiomeDataList {
  id: ByteTag; // numerical biome ID, likely a resource from Region-Types
  snowAccumulation: FloatTag;
}

export interface MobEvents {
  events_enabled: BooleanTag;
  "minecraft:ender_dragon_event": BooleanTag;
  "minecraft:pillager_patrols_event": BooleanTag;
  "minecraft:wandering_trader_event": BooleanTag;
}

export interface SchedulerWT {
  daysSinceLastWTSpawn: IntTag;
  isSpawningWT: BooleanTag; // most likely boolean?
  nextWTSpawnCheckTick: LongTag;
}

export interface Scoreboard {
  Criteria: unknown[];
  DisplayObjectives: ScoreboardDisplayObjective[];
  Entries: ScoreboardEntry[];
  Objectives: ScoreboardObjective[];
  LastUniqueId: LongTag;
}

export interface ScoreboardDisplayObjective {
  Name: StringTag;
  ObjectiveName: StringTag; // the internal name of the objective displayed; Resource ID of some sort?
  SortOrder?: ByteTag<ScoreboardDisplayObjectiveSortOrder>; // seems to be optional; 'if not specified'
}

export type ScoreboardDisplayObjectiveSortOrder = 0 | 1;

export interface ScoreboardEntry {
  IdentityType: ByteTag<ScoreboardEntryType>;
  EntityId?: LongTag;
  PlayerId?: LongTag;
  ScoreboardId: LongTag;
}

export type ScoreboardEntryType = 1 | 2;

export interface ScoreboardObjective {
  Criteria: "dummy";
  DisplayName: StringTag;
  Name: StringTag; // internal name of this objective; maybe resource ID? This might be user-defined actually, though
  Scores: ScoreboardObjectiveScore[];
}

export interface ScoreboardObjectiveScore {
  Score: IntTag;
  ScoreboardId: LongTag;
}

export interface VillageDwellers {
  Dwellers: VillageDweller[];
}

export interface VillageDweller {
  actors: VillageDwellerActor[];
}

export interface VillageDwellerActor {
  ID: LongTag;
  last_saved_pos: VillageDwellerActorPos;
  TS: LongTag;
}

export type VillageDwellerActorPos = [IntTag, IntTag, IntTag];

export interface VillageInfo {
  BDTime: LongTag;
  GDTime: LongTag;
  Initialized: BooleanTag; // maybe boolean?
  MTick: LongTag;
  PDTick: LongTag;
  RX0: IntTag;
  RX1: IntTag;
  RY0: IntTag;
  RY1: IntTag;
  RZ0: IntTag;
  RZ1: IntTag;
  Tick: LongTag;
  Version: ByteTag;
  X0: IntTag;
  X1: IntTag;
  Y0: IntTag;
  Y1: IntTag;
  Z0: IntTag;
  Z1: IntTag;
}

export interface VillagePlayers {
  Players: unknown[]; // maybe `Player[]`, but I nor the wiki know for sure
}

export interface VillagePois {
  POI: VillagePoi[];
}

export interface VillagePoi {
  instances: VillagePoiInstance[];
  VillagerID: LongTag;
}

export interface VillagePoiInstance {
  Capacity: LongTag;
  InitEvent: StringTag; // some kind of resource?
  Name: StringTag; // resource?
  OwnerCount: LongTag;
  Radius: FloatTag;
  Skip: BooleanTag; // maybe boolean?
  SoundEvent: StringTag; // resource?
  Type: IntTag; // some kind of union type?
  UseAABB: BooleanTag; // boolean?
  Weight: LongTag;
  X: IntTag;
  Y: IntTag;
  Z: IntTag;
}

export interface Map {
  [name: string]: never;
}