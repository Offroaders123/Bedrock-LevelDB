import { NBTError, read } from "nbtify";
import { CHUNK_KEY, DimensionID } from "../Region-Types/dist/bedrock/index.js";

import type { NBTData, ReadOptions, RootTagLike } from "nbtify";
import type { ActorDigestVersion, ActorPrefix, AutonomousEntities, BiomeData, BiomeState, BlendingBiomeHeight, BlendingData, BlockEntities, BlockEntity, BorderBlocks, CheckSums, ChunkKey, ChunkKeyEntry, ChunkKeyNameMap, ChunkValue, ConversionData, Data2D, Data2DLegacy, Data3D, DigP, Entities, Entity, FinalizedState, GameFlatWorldLayers, GeneratedPreCavesAndCliffsBlending, GenerationSeed, HardcodedSpawners, Key, LegacyBlockExtraData, LegacyDimension0, LegacyDimension1, LegacyMVillages, LegacyTerrain, LegacyVersion, LevelChunkMetaDataDictionary, LevelChunkMetaDataDictionaryEntry, LevelChunkMetaDataDictionaryTag, LocalPlayer, Map, MetaDataHash, MobEvents, Nether, Overworld, PendingTick, PendingTicks, PlayerServer, PlayerServerDef, Portals, PosTrackDB, PositionTrackDBLastId, RandomTick, RandomTicks, SchedulerWT, Scoreboard, SubChunkPrefix, SuffixKey, SuffixKeyEntry, SuffixKeyNameMap, SuffixValue, TheEnd, TickingArea, Value, Version, VillageDwellers, VillageInfo, VillagePlayers, VillagePois, WorldKey, WorldKeyNameMap, WorldValue } from "../Region-Types/dist/bedrock/index.js";

export type Entry = [Key, Value];

export async function readEntry(entry: [Buffer, Buffer]): Promise<Key> {
  const key: Key = readKey(entry[0]);
  // const value: Value = await readValue(key,entry[1]);
  return key;
}

export function readKey(key: Buffer): Key {
  const suffixKey = readSuffixKey(key);
  if (suffixKey !== null) return suffixKey;
  // console.log(stringy);

  const worldKey = readWorldKey(key);
  if (worldKey !== null) return worldKey;

  // console.log(key)//,stringy);

  const chunkKey = readChunkKey(key);
  if (chunkKey !== null) return chunkKey;

  throw new Error(`Encountered unknown key type, '${key.toString("utf-8")}'.`);
}

export function readSuffixKey<K extends keyof SuffixKeyNameMap>(key: Buffer): SuffixKeyEntry<K> | null;
export function readSuffixKey(key: Buffer): SuffixKeyEntry | null {
  const keyString: string = key.toString("utf-8");
  let keyType: keyof SuffixKeyNameMap | null;

  switch (true){
    case actorprefix.test(keyString): keyType = "actorprefix"; break;
    case digp.test(keyString): keyType = "digp"; break;
    case posTrackDB.test(keyString): keyType = "posTrackDB"; break;
    case player.test(keyString): keyType = "player"; break;
    case player_server.test(keyString): keyType = "player_server"; break;
    case tickingarea.test(keyString): keyType = "tickingarea"; break;
    case village_dwellers.test(keyString): keyType = "VILLAGE_DWELLERS"; break;
    case village_info.test(keyString): keyType = "VILLAGE_INFO"; break;
    case village_players.test(keyString): keyType = "VILLAGE_PLAYERS"; break;
    case village_poi.test(keyString): keyType = "VILLAGE_POI"; break;
    case village_dwellers_overworld.test(keyString): keyType = "VILLAGE_DWELLERS"; break;
    case village_info_overworld.test(keyString): keyType = "VILLAGE_INFO"; break;
    case village_players_overworld.test(keyString): keyType = "VILLAGE_PLAYERS"; break;
    case village_poi_overworld.test(keyString): keyType = "VILLAGE_POI"; break;
    case map.test(keyString): keyType = "map"; break;
    default: keyType = null; break;
  }

  switch (keyType){
    case "actorprefix":
    case "digp":
    case "posTrackDB":
    case "player":
    case "player_server":
    case "tickingarea":
    case "VILLAGE_DWELLERS":
    case "VILLAGE_INFO":
    case "VILLAGE_PLAYERS":
    case "VILLAGE_POI":
    case "map": return `${keyType}@0x${key.subarray(keyType.length).toString("hex")}`;
    default: return null;
  }
}

export function readWorldKey<K extends keyof WorldKeyNameMap>(key: Buffer): WorldKey<K> | null;
export function readWorldKey(key: Buffer): WorldKey | null {
  const stringy = key.toString("utf-8") as keyof WorldKeyNameMap;
  switch (stringy){
    case "AutonomousEntities":
    case "BiomeData":
    case "LevelChunkMetaDataDictionary":
    case "Nether":
    case "Overworld":
    case "TheEnd":
    case "dimension0":
    case "dimension1":
    case "game_flatworldlayers":
    case "PositionTrackDB-LastId":
    case "mVillages":
    case "mobevents":
    case "portals":
    case "schedulerWT":
    case "scoreboard":
    case "~local_player":
      return stringy;
    default:
      return null;
  }
}

export function readChunkKey<K extends keyof ChunkKeyNameMap>(key: Buffer): ChunkKeyEntry<K> | null;
export function readChunkKey(key: Buffer): ChunkKeyEntry | null {
  const view = new DataView(key.buffer,key.byteOffset,key.byteLength);

  const x = view.getInt32(0,true);
  const y = view.getInt32(4,true);
  const dimension: DimensionID = key.byteLength < 12 ? DimensionID.overworld : view.getInt32(8,true);
  const type = view.getUint8(dimension === DimensionID.overworld ? 8 : 12);
  const subchunk: number | null = type === CHUNK_KEY.SubChunkPrefix ? view.getInt8(dimension === DimensionID.overworld ? 9 : 13) : null;

  // if (type === CHUNK_KEY.SubChunkPrefix){
  //   console.log(key);
  //   console.log(CHUNK_KEY[type],subchunk);
  //   console.log(Dimension[dimension],"\n");
  // }

  if (CHUNK_KEY[type] === undefined) return null;

  return { x, y, dimension, type: CHUNK_KEY[type]! as keyof ChunkKeyNameMap, subchunk };
}

export async function readValue(key: Key, value: Buffer): Promise<Value> {
  if (typeof key === "string"){
    const worldValue = await readWorldValue(key,value);
    if (worldValue !== null) return worldValue;
  }

  const chunkValue = await readChunkValue(key as ChunkKey,value);
  if (chunkValue !== null) return chunkValue;

  const suffixValue = await readSuffixKeyValue(key as SuffixKey,value);
  if (suffixValue !== null) return suffixValue;

  console.error("Encountered unknown key-value type");
  throw { key, value, nbt: await read(value,format) };
}

export async function readWorldValue<K extends keyof WorldKeyNameMap>(key: K, value: Buffer): Promise<WorldValue<K> | null>;
export async function readWorldValue(key: keyof WorldKeyNameMap, value: Buffer): Promise<WorldValue | null> {
  switch (key){
    case "AutonomousEntities": return read<AutonomousEntities>(value,format);
    case "BiomeData": return read<BiomeData>(value,format);
    case "dimension0": return read<LegacyDimension0>(value,format);//.then(data => { console.log(key,data.data); return data; });
    case "dimension1": return read<LegacyDimension1>(value,format);//.then(data => { console.log(key,data.data); return data; });
    case "mVillages": return read<LegacyMVillages>(value,format);//.then(data => { console.log(key,data.data); return data; });
    case "game_flatworldlayers": return value as GameFlatWorldLayers;
    case "PositionTrackDB-LastId": return read<PositionTrackDBLastId>(value,format);
    case "LevelChunkMetaDataDictionary": {
      // This "function" is a custom derivation of `readNBTList()`, because I needed to add in the handling for the `count` and `key` values. Eventually these shouldn't use duplicated logic.
      const count = value.readUint32LE(0);
      value = value.subarray(4);
      const entries: LevelChunkMetaDataDictionaryEntry[] = [];

      while (true){
        if (value.byteLength === 0) break;
        try {
          const tag = await read<LevelChunkMetaDataDictionaryTag>(value.subarray(8),format);
          const key = value.subarray(0,8); // Temporary string, I don't know how these should be read more accurately yet.
          entries.push({ key, tag });
          break;
        } catch (error){
          const message: string = (error as Error).message ?? `${error}`;
          const length: number = parseInt(message.slice(46));
          const tag = await read<LevelChunkMetaDataDictionaryTag>(value.subarray(8),{ ...format, strict: false });
          const key = value.subarray(0,8);
          entries.push({ key, tag });
          value = value.subarray(8 + length);
        }
      }
    
      return { count, entries } satisfies LevelChunkMetaDataDictionary;
    }
    case "~local_player": return read<LocalPlayer>(value,format);
    case "mobevents": return read<MobEvents>(value,format);
    case "Overworld": return read<Overworld>(value,format);
    case "Nether": return read<Nether>(value,format);
    case "TheEnd": return read<TheEnd>(value,format);
    case "portals": return read<Portals>(value,format);
    case "schedulerWT": return read<SchedulerWT>(value,format);
    case "scoreboard": return read<Scoreboard>(value,format);
    // default: return value;
    default: return null;
  }
}

export async function readChunkValue<K extends keyof ChunkKeyNameMap>(key: ChunkKey, value: Buffer): Promise<ChunkValue<K> | null>;
export async function readChunkValue(key: ChunkKey, value: Buffer): Promise<ChunkValue | null> {
  switch (key.type){
    // ChunkKey
    case "Data3D": return value as Data3D;
    case "Version": return value.readInt8() as Version;
    case "Data2D": return value as Data2D;
    case "Data2DLegacy": return value as Data2DLegacy;
    case "SubChunkPrefix": return value as SubChunkPrefix;
    case "LegacyTerrain": return value as LegacyTerrain;
    case "BlockEntity": return readNBTList<BlockEntity>(value) as Promise<BlockEntities>;
    case "Entity": return readNBTList<Entity>(value) as Promise<Entities>;
    case "PendingTicks": return readNBTList<PendingTick>(value) as Promise<PendingTicks>;
    case "LegacyBlockExtraData": return { entries: value.readInt32LE(), entriesKey: value.readInt32LE(4), value: value.readInt16LE(8) } as LegacyBlockExtraData;
    case "BiomeState": return value as BiomeState;
    case "FinalizedState": return value.readInt32LE() as FinalizedState;
    case "ConversionData": return value as ConversionData;
    case "BorderBlocks": return value as BorderBlocks;
    case "HardcodedSpawners": return value as HardcodedSpawners;
    case "RandomTicks": return readNBTList<RandomTick>(value) as Promise<RandomTicks>;
    case "CheckSums": return value as CheckSums;
    case "GenerationSeed": return value as GenerationSeed;
    case "GeneratedPreCavesAndCliffsBlending": return Boolean(value.readInt8()) as GeneratedPreCavesAndCliffsBlending;
    case "BlendingBiomeHeight": return value as BlendingBiomeHeight;
    case "MetaDataHash": return value as MetaDataHash;
    case "BlendingData": return value as BlendingData;
    case "ActorDigestVersion": return value.readInt8() as ActorDigestVersion;
    case "LegacyVersion": return value.readInt8() as LegacyVersion;
    default: return null;
  }
}

export async function readSuffixKeyValue<K extends keyof SuffixKeyNameMap>(key: SuffixKey, value: Buffer): Promise<SuffixValue<K> | null>;
export async function readSuffixKeyValue(key: SuffixKey, value: Buffer): Promise<SuffixValue | null> {
  switch (key.type){
    // SuffixKey
    case "actorprefix": return read<ActorPrefix>(value,format);
    case "digp": return value as DigP;
    case "posTrackDB": return read<PosTrackDB>(value,format);//.then(data => { console.log(key.key.toString("utf-8"),data); return data; });
    case "player": return read<PlayerServerDef>(value,format);//.then(data => { console.log(key.key.toString("utf-8"),data); return data; });
    case "player_server": return read<PlayerServer>(value,format);//.then(data => { console.log(key.key.toString("utf-8"),data); return data; });
    case "VILLAGE_DWELLERS": return read<VillageDwellers>(value,format);
    case "VILLAGE_INFO": return read<VillageInfo>(value,format);
    case "VILLAGE_PLAYERS": return read<VillagePlayers>(value,format);
    case "VILLAGE_POI": return read<VillagePois>(value,format);
    case "map": return read<Map>(value,format);
    case "tickingarea": return read<TickingArea>(value,format);
    // default: return value;
    // default: throw { key, value, nbt: await read(value,format) };
    default: return null;
  }
}

export async function readNBTList<T extends RootTagLike>(data: Uint8Array): Promise<NBTData<T>[]> {
  const entries: NBTData<T>[] = [];

  while (true){
    if (data.byteLength === 0) break;
    try {
      const entry: NBTData<T> = await read<T>(data,format);
      entries.push(entry);
      break;
    } catch (error){
      if (!(error instanceof NBTError)){
        throw error;
      }
      const length: number = error.byteOffset;
      const entry: NBTData<T> = error.cause as NBTData<T>;
      entries.push(entry);
      data = data.subarray(length);
    }
  }

  return entries;
}

export const format = {
  rootName: true,
  endian: "little",
  compression: null,
  bedrockLevel: false,
  strict: true
} as const satisfies Required<ReadOptions>;

export const actorprefix = /^actorprefix/;
export const digp = /^digp/;
export const posTrackDB = /^PosTrackDB-/;
export const player = /^player_/
export const player_server = /^player_server_/
export const tickingarea = /^tickingarea_/;
export const village_dwellers = /VILLAGE_[0-9a-f\\-]+_DWELLERS/;
export const village_info = /VILLAGE_[0-9a-f\\-]+_INFO/;
export const village_players = /VILLAGE_[0-9a-f\\-]+_PLAYERS/;
export const village_poi = /VILLAGE_[0-9a-f\\-]+_POI/;
// needs more debugging; I opened the world with v1.20.51.01
const village_dwellers_overworld = /VILLAGE_Overworld_[0-9a-f\\-]+_DWELLERS/;
const village_info_overworld = /VILLAGE_Overworld_[0-9a-f\\-]+_INFO/;
const village_players_overworld = /VILLAGE_Overworld_[0-9a-f\\-]+_PLAYERS/;
const village_poi_overworld = /VILLAGE_Overworld_[0-9a-f\\-]+_POI/;
export const map = /map_\-[0-9]+/;