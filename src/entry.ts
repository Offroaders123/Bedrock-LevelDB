import { NBTError, read } from "nbtify";

import type { NBTData, ReadOptions, ByteTag, BooleanTag, IntTag, LongTag, FloatTag, StringTag, RootTagLike, ByteArrayTag, ShortTag, IntArrayTag } from "nbtify";

export type Entry = [Key, Value];

export async function readEntry(entry: [Buffer, Buffer]): Promise<Entry> {
  const key: Key = readKey(entry[0]);
  const value: Value = await readValue(key,entry[1]);
  return [key,value];
}

export enum Dimension {
  overworld = 0,
  nether,
  end
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

export function readSuffixKey<K extends keyof SuffixKeyNameMap>(key: Buffer): SuffixKeyEntry<K> | null {
  const keyString: string = key.toString("utf-8");
  let keyType: K | null;

  switch (true){
    case actorprefix.test(keyString): keyType = "actorprefix" as K; break;
    case digp.test(keyString): keyType = "digp" as K; break;
    case posTrackDB.test(keyString): keyType = "posTrackDB" as K; break;
    case player.test(keyString): keyType = "player" as K; break;
    case player_server.test(keyString): keyType = "player_server" as K; break;
    case tickingarea.test(keyString): keyType = "tickingarea" as K; break;
    case village_dwellers.test(keyString): keyType = "VILLAGE_DWELLERS" as K; break;
    case village_info.test(keyString): keyType = "VILLAGE_INFO" as K; break;
    case village_players.test(keyString): keyType = "VILLAGE_PLAYERS" as K; break;
    case village_poi.test(keyString): keyType = "VILLAGE_POI" as K; break;
    case map.test(keyString): keyType = "map" as K; break;
    default: keyType = null; break;
  }

  switch (keyType){
    case "actorprefix": return { type: keyType, key };
    case "digp": return { type: keyType, key };
    case "posTrackDB": return { type: keyType, key };
    case "player": return { type: keyType, key };
    case "player_server": return { type: keyType, key };
    case "tickingarea": return { type: keyType, key };
    case "VILLAGE_DWELLERS": return { type: keyType, key };
    case "VILLAGE_INFO": return { type: keyType, key };
    case "VILLAGE_PLAYERS": return { type: keyType, key };
    case "VILLAGE_POI": return { type: keyType, key };
    case "map": return { type: keyType, key };
    default: return null;
  }
}

export function readWorldKey<K extends keyof WorldKeyNameMap>(key: Buffer): WorldKey<K> | null {
  const stringy = key.toString("utf-8") as K;
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

export function readChunkKey<K extends keyof ChunkKeyNameMap>(key: Buffer): ChunkKeyEntry<K> | null {
  const view = new DataView(key.buffer,key.byteOffset,key.byteLength);

  const x = view.getInt32(0,true);
  const y = view.getInt32(4,true);
  const dimension: Dimension = key.byteLength < 12 ? Dimension.overworld : view.getInt32(8,true);
  const type = view.getUint8(dimension === Dimension.overworld ? 8 : 12);
  const subchunk: number | null = type === CHUNK_KEY.SubChunkPrefix ? view.getInt8(dimension === Dimension.overworld ? 9 : 13) : null;

  // if (type === CHUNK_KEY.SubChunkPrefix){
  //   console.log(key);
  //   console.log(CHUNK_KEY[type],subchunk);
  //   console.log(Dimension[dimension],"\n");
  // }

  if (CHUNK_KEY[type] === undefined) return null;

  return { x, y, dimension, type: CHUNK_KEY[type]! as K, subchunk } satisfies ChunkKeyEntry<K>;
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

export async function readWorldValue<K extends keyof WorldKeyNameMap>(key: K, value: Buffer): Promise<WorldValue<K> | null> {
  switch (key){
    case "AutonomousEntities": return read<AutonomousEntities>(value,format) as Promise<WorldValue<K>>;
    case "BiomeData": return read<BiomeData>(value,format) as Promise<WorldValue<K>>;
    case "dimension0": return read<LegacyDimension0>(value,format) as Promise<WorldValue<K>>;//.then(data => { console.log(key,data.data); return data; });
    case "dimension1": return read<LegacyDimension1>(value,format) as Promise<WorldValue<K>>;//.then(data => { console.log(key,data.data); return data; });
    case "mVillages": return read<LegacyMVillages>(value,format) as Promise<WorldValue<K>>;//.then(data => { console.log(key,data.data); return data; });
    case "game_flatworldlayers": return value as GameFlatWorldLayers as WorldValue<K>;
    case "PositionTrackDB-LastId": return read<PositionTrackDBLastId>(value,format) as Promise<WorldValue<K>>;
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
    
      return { count, entries } satisfies LevelChunkMetaDataDictionary as WorldValue<K>;
    }
    case "~local_player": return read<LocalPlayer>(value,format) as Promise<WorldValue<K>>;
    case "mobevents": return read<MobEvents>(value,format) as Promise<WorldValue<K>>;
    case "Overworld": return read<Overworld>(value,format) as Promise<WorldValue<K>>;
    case "Nether": return read<Nether>(value,format) as Promise<WorldValue<K>>;
    case "TheEnd": return read<TheEnd>(value,format) as Promise<WorldValue<K>>;
    case "portals": return read<Portals>(value,format) as Promise<WorldValue<K>>;
    case "schedulerWT": return read<SchedulerWT>(value,format) as Promise<WorldValue<K>>;
    case "scoreboard": return read<Scoreboard>(value,format) as Promise<WorldValue<K>>;
    // default: return value;
    default: return null;
  }
}

export async function readChunkValue<K extends keyof ChunkKeyNameMap>(key: ChunkKey, value: Buffer): Promise<ChunkValue<K> | null> {
  switch (key.type){
    // ChunkKey
    case "Data3D": return value as Data3D as ChunkValue<K>;
    case "Version": return value.readInt8() as Version as ChunkValue<K>;
    case "Data2D": return value as Data2D as ChunkValue<K>;
    case "Data2DLegacy": return value as Data2DLegacy as ChunkValue<K>;
    case "SubChunkPrefix": return value as SubChunkPrefix as ChunkValue<K>;
    case "LegacyTerrain": return value as LegacyTerrain as ChunkValue<K>;
    case "BlockEntity": return readNBTList<BlockEntity>(value) as Promise<BlockEntities> as Promise<ChunkValue<K>>;
    case "Entity": return readNBTList<Entity>(value) as Promise<Entities> as Promise<ChunkValue<K>>;
    case "PendingTicks": return readNBTList<PendingTick>(value) as Promise<PendingTicks> as Promise<ChunkValue<K>>;
    case "LegacyBlockExtraData": return { entries: value.readInt32LE(), entriesKey: value.readInt32LE(4), value: value.readInt16LE(8) } as LegacyBlockExtraData as ChunkValue<K>;
    case "BiomeState": return value as BiomeState as ChunkValue<K>;
    case "FinalizedState": return value.readInt32LE() as FinalizedState as ChunkValue<K>;
    case "ConversionData": return value as ConversionData as ChunkValue<K>;
    case "BorderBlocks": return value as BorderBlocks as ChunkValue<K>;
    case "HardcodedSpawners": return value as HardcodedSpawners as ChunkValue<K>;
    case "RandomTicks": return readNBTList<RandomTick>(value) as Promise<RandomTicks> as Promise<ChunkValue<K>>;
    case "CheckSums": return value as CheckSums as ChunkValue<K>;
    case "GenerationSeed": return value as GenerationSeed as ChunkValue<K>;
    case "GeneratedPreCavesAndCliffsBlending": return Boolean(value.readInt8()) as GeneratedPreCavesAndCliffsBlending as ChunkValue<K>;
    case "BlendingBiomeHeight": return value as BlendingBiomeHeight as ChunkValue<K>;
    case "MetaDataHash": return value as MetaDataHash as ChunkValue<K>;
    case "BlendingData": return value as BlendingData as ChunkValue<K>;
    case "ActorDigestVersion": return value.readInt8() as ActorDigestVersion as ChunkValue<K>;
    case "LegacyVersion": return value.readInt8() as LegacyVersion as ChunkValue<K>;
    default: return null;
  }
}

export async function readSuffixKeyValue<K extends keyof SuffixKeyNameMap>(key: SuffixKey, value: Buffer): Promise<SuffixValue<K> | null> {
  switch (key.type){
    // SuffixKey
    case "actorprefix": return read<ActorPrefix>(value,format) as Promise<SuffixValue<K>>;
    case "digp": return value as DigP as SuffixValue<K>;
    case "posTrackDB": return read<PosTrackDB>(value,format) as Promise<SuffixValue<K>>;//.then(data => { console.log(key.key.toString("utf-8"),data); return data; });
    case "player": return read<PlayerServerDef>(value,format) as Promise<SuffixValue<K>>;//.then(data => { console.log(key.key.toString("utf-8"),data); return data; });
    case "player_server": return read<PlayerServer>(value,format) as Promise<SuffixValue<K>>;//.then(data => { console.log(key.key.toString("utf-8"),data); return data; });
    case "VILLAGE_DWELLERS": return read<VillageDwellers>(value,format) as Promise<SuffixValue<K>>;
    case "VILLAGE_INFO": return read<VillageInfo>(value,format) as Promise<SuffixValue<K>>;
    case "VILLAGE_PLAYERS": return read<VillagePlayers>(value,format) as Promise<SuffixValue<K>>;
    case "VILLAGE_POI": return read<VillagePois>(value,format) as Promise<SuffixValue<K>>;
    case "map": return read<Map>(value,format) as Promise<SuffixValue<K>>;
    case "tickingarea": return read<TickingArea>(value,format) as Promise<SuffixValue<K>>;
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

export type Key = WorldKey | SuffixKeyEntry | ChunkKeyEntry;

export type WorldKey<K extends keyof WorldKeyNameMap = keyof WorldKeyNameMap> = K;

export type WorldValue<K extends keyof WorldKeyNameMap = keyof WorldKeyNameMap> = WorldKeyNameMap[K];

export interface WorldKeyNameMap {
  BiomeData: NBTData<BiomeData>;
  dimension0: NBTData<LegacyDimension0>;
  dimension1: NBTData<LegacyDimension1>;
  mVillages: NBTData<LegacyMVillages>;
  LevelChunkMetaDataDictionary: LevelChunkMetaDataDictionary;
  game_flatworldlayers: GameFlatWorldLayers;
  "PositionTrackDB-LastId": NBTData<PositionTrackDBLastId>;
  "~local_player": NBTData<LocalPlayer>;
  AutonomousEntities: NBTData<AutonomousEntities>;
  Overworld: NBTData<Overworld>;
  Nether: NBTData<Nether>;
  TheEnd: NBTData<TheEnd>;
  mobevents: NBTData<MobEvents>;
  portals: NBTData<Portals>;
  schedulerWT: NBTData<SchedulerWT>;
  scoreboard: NBTData<Scoreboard>;
}

export type SuffixKey<K extends keyof SuffixKeyNameMap = keyof SuffixKeyNameMap> = SuffixKeyEntry<K>;

export interface SuffixKeyEntry<K extends keyof SuffixKeyNameMap = keyof SuffixKeyNameMap> {
  type: K;
  // value: SuffixKeyNameMap[K];
  key: Buffer;
}

export type SuffixValue<K extends keyof SuffixKeyNameMap = keyof SuffixKeyNameMap> = SuffixKeyNameMap[K];

export interface SuffixKeyNameMap {
  actorprefix: ActorPrefix;
  digp: DigP;
  posTrackDB: NBTData<PosTrackDB>;
  player: NBTData<PlayerServerDef>;
  player_server: NBTData<PlayerServer>;
  tickingarea: NBTData<TickingArea>;
  VILLAGE_DWELLERS: NBTData<VillageDwellers>;
  VILLAGE_INFO: NBTData<VillageInfo>;
  VILLAGE_PLAYERS: NBTData<VillagePlayers>;
  VILLAGE_POI: NBTData<VillagePois>;
  map: NBTData<Map>;
}

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
export const map = /map_\-[0-9]+/;

export type ChunkKey<K extends keyof ChunkKeyNameMap = keyof ChunkKeyNameMap> = ChunkKeyEntry<K>;

export interface ChunkKeyEntry<K extends keyof ChunkKeyNameMap = keyof ChunkKeyNameMap> {
  x: number;
  y: number;
  type: K;
  dimension: Dimension;
  subchunk: number | null;
  // value: ChunkKeyNameMap[K];
}

export type ChunkValue<K extends keyof ChunkKeyNameMap = keyof ChunkKeyNameMap> = ChunkKeyNameMap[K];

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

export interface ChunkKeyNameMap {
  Data3D: Data3D;
  Version: Version;
  Data2D: Data2D;
  Data2DLegacy: Data2DLegacy;
  SubChunkPrefix: SubChunkPrefix;
  LegacyTerrain: LegacyTerrain;
  BlockEntity: BlockEntity;
  Entity: Entity;
  PendingTicks: PendingTicks;
  LegacyBlockExtraData: LegacyBlockExtraData;
  BiomeState: BiomeState;
  FinalizedState: FinalizedState;
  ConversionData: ConversionData;
  BorderBlocks: BorderBlocks;
  HardcodedSpawners: HardcodedSpawners;
  RandomTicks: RandomTicks;
  CheckSums: CheckSums;
  GenerationSeed: GenerationSeed;
  GeneratedPreCavesAndCliffsBlending: GeneratedPreCavesAndCliffsBlending;
  BlendingBiomeHeight: BlendingBiomeHeight;
  MetaDataHash: MetaDataHash;
  BlendingData: BlendingData;
  ActorDigestVersion: ActorDigestVersion;
  LegacyVersion: LegacyVersion;
}

export type Value = WorldValue | SuffixValue | ChunkValue;

// WorldKey

export interface AutonomousEntities {
  AutonomousEntityList: object[];
}

export interface BiomeData {
  list: BiomeDataList[];
}

export interface BiomeDataList {
  id: ByteTag; // numerical biome ID, likely a resource from Region-Types
  snowAccumulation: FloatTag;
}

export type GameFlatWorldLayers = Buffer;

export interface LevelChunkMetaDataDictionary {
  count: number;
  entries: LevelChunkMetaDataDictionaryEntry[];
}

export interface LevelChunkMetaDataDictionaryEntry {
  key: Buffer; // temporary, I'm not sure how this is supposed to be parsed nicely
  tag: NBTData<LevelChunkMetaDataDictionaryTag>;
}

export interface LevelChunkMetaDataDictionaryTag {
  BiomeBaseGameVersion: StringTag;
  DimensionName: DimensionName;
  GenerationSeed: LongTag;
  GeneratorType: IntTag; // could be a union instead? `1` appears to be the regular setting.
  LastSavedBaseGameVersion?: StringTag;
  LastSavedDimensionHeightRange?: DimensionHeightRange;
  OriginalBaseGameVersion: StringTag;
  OriginalDimensionHeightRange: DimensionHeightRange;
  // Why are these `ShortTag`s? The values look like booleans! dangit Mojang.
  // and I think these are unique to the Overworld, at the moment at least.
  Overworld1_18HeightExtended?: ShortTag;
  UnderwaterLavaLakeFixed?: ShortTag;
  WorldGenBelowZeroFixed?: ShortTag;
}

export type DimensionName = "Overworld" | "Nether" | "TheEnd";

export interface DimensionHeightRange {
  max: ShortTag;
  min: ShortTag;
}

export interface LocalPlayer {
  // [name: string]: never; // from Region-Types
}

export interface MobEvents {
  events_enabled: BooleanTag;
  "minecraft:ender_dragon_event": BooleanTag;
  "minecraft:pillager_patrols_event": BooleanTag;
  "minecraft:wandering_trader_event": BooleanTag;
}

export interface Overworld {
  // [name: string]: never; // untyped atm
}

export interface SchedulerWT {
  daysSinceLastWTSpawn: IntTag;
  isSpawningWT: BooleanTag; // most likely boolean?
  nextWTSpawnCheckTick: LongTag;
}

export interface Scoreboard {
  Criteria: object[];
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

// ChunkKey

export type Data3D = Buffer;
export type Version = number;
export type Data2D = Buffer;
export type Data2DLegacy = Buffer;
export type SubChunkPrefix = Buffer;
export type LegacyTerrain = Buffer;

export type BlockEntities = NBTData<BlockEntity>[];

export interface BlockEntity {
  // [name: string]: never; // declared from Region-Types
}

export type Entities = NBTData<Entity>[];

export interface Entity {
  // [name: string]: never; // declared from Region-Types
}

export type PendingTicks = NBTData<PendingTick>[];

export interface PendingTick {
  // [name: string]: never; // untyped atm
}

export interface LegacyBlockExtraData {
  entries: number;
  entriesKey: number;
  value: number;
}

export type BiomeState = Buffer; // NBT?
export type FinalizedState = number;
export type ConversionData = Buffer; // NBT?
export type BorderBlocks = Buffer; // NBT?
export type HardcodedSpawners = Buffer; // NBT?

export type RandomTicks = NBTData<RandomTick>[];

export interface RandomTick {
  // [name: string]: never; // untyped atm
}

export type CheckSums = Buffer;
export type GenerationSeed = Buffer;
export type GeneratedPreCavesAndCliffsBlending = boolean;
export type BlendingBiomeHeight = Buffer;
export type MetaDataHash = Buffer;
export type BlendingData = Buffer;
export type ActorDigestVersion = number;
export type LegacyVersion = number;

// SuffixKey

export interface ActorPrefix {
  // [name: string]: never; // untyped atm
}

export type DigP = Buffer;

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
  Players: object[]; // maybe `Player[]`, but I nor the wiki know for sure
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
  colors: ByteArrayTag;
  decorations: object[];
  dimension: ByteTag<Dimension>;
  fullyExplored: BooleanTag;
  height: ShortTag;
  mapId: LongTag;
  mapLocked: BooleanTag;
  parentMapId: LongTag;
  scale: ByteTag<MapScale>; // ~~might be a union of only a few values~~
  unlimitedTracking: BooleanTag;
  width: ShortTag;
  xCenter: IntTag;
  zCenter: IntTag;
}

export type MapScale = 0 | 1 | 2 | 3 | 4; // this is approximated, there are 5 levels of maps, looks like? The DB can account for this as well, there were 5 entries for a single map in the world, all with the same reference `parentMapId`.

export interface Portals {
  data: {
    PortalRecords: PortalRecord[];
  };
}

export interface PortalRecord {
  DimId: IntTag;
  Span: ByteTag;
  TpX: IntTag;
  TpY: IntTag;
  TpZ: IntTag;
  Xa: ByteTag;
  Za: ByteTag;
}

export interface Nether {
  data: {
    LimboEntities: object[]; // `Entity[]`?
  };
}

export interface TheEnd {
  data: {
    DragonFight: DragonFight;
    LimboEntities: object[];
  };
}

export interface DragonFight {
  DragonFightVersion: ByteTag;
  DragonKilled: BooleanTag;
  DragonSpawned: BooleanTag;
  DragonUUID: LongTag;
  ExitPortalLocation: [IntTag, IntTag, IntTag];
  Gateways: IntTag[]; // Maybe tuple of 20x`IntTag`? Not sure how this works exactly
  IsRespawning: BooleanTag;
  PreviouslyKilled: BooleanTag;
}

export interface TickingArea {
  Dimension: IntTag<Dimension>;
  IsCircle: BooleanTag;
  MaxX: IntTag;
  MaxZ: IntTag;
  MinX: IntTag;
  MinZ: IntTag;
  Name: StringTag;
  Preload: BooleanTag;
}

export interface PosTrackDB {
  dim: IntTag<Dimension>;
  id: StringTag;
  pos: [IntTag, IntTag, IntTag];
  status: ByteTag; // `BooleanTag`?
  version: ByteTag; // same here
}

export interface PositionTrackDBLastId {
  id: StringTag;
  version: ByteTag;
}

export interface PlayerServerDef {
  MsaId: StringTag;
  PlatformOfflineId?: StringTag;
  PlatformOnlineId?: StringTag;
  SelfSignedId: StringTag;
  ServerId: StringTag;
}

export interface PlayerServer {
  // [name: string]: unknown; // `Player` I'm pretty sure essentially, there might be more keys for server players than the plain `LocalPlayer` though.
}

export interface LegacyDimension0 {
  mansion: {
    structures?: Structure[];
  };
  mineshaft: {
    structures?: Structure[];
  };
  oceans: {
    structures?: Structure[];
  };
  stronghold: {
    structures?: Structure[];
  };
  village: {
    structures?: Structure[];
  };
}

export interface LegacyDimension1 {
  bridge: {
    structures?: Structure[];
  };
}

export interface Structure {
  BB: IntArrayTag;
  Children: StructureChildren[];
  ChunkX: IntTag;
  ChunkZ: IntTag;
  ID: IntTag; // union, or unique? I think maybe union of structure piece variants; should be unique to each 'structure' if made into a union type.
  iscreated?: BooleanTag; // likely boolean hehe, maybe optional? *might be only for Ocean Monument
  Valid?: BooleanTag; // villages
}

export interface StructureChildren {
  Abandoned?: BooleanTag; // villages
  Entrances?: [IntArrayTag, IntArrayTag, IntArrayTag]; // mineshaft
  BB: IntArrayTag;
  CA?: IntTag; // villages
  CB?: IntTag; // villages
  CC?: IntTag; // villages
  CD?: IntTag; // villages
  Chest?: BooleanTag; // villages; bridge (fortress)
  D?: IntTag; // mineshaft
  Desert?: BooleanTag; // villages
  HPos?: IntTag; // villages
  ID: IntTag;
  Num?: IntTag; // mineshaft
  Mob?: BooleanTag; // bridge (fortress)
  hps?: ByteTag; // mineshaft
  hr?: ByteTag; // mineshaft
  sc?: ByteTag; // mineshaft
  Savannah?: BooleanTag; // villages
  Seed?: IntTag; // bridge (fortress)
  Taiga?: BooleanTag; // villages
  Terrace?: BooleanTag; // villages
  tf?: ByteTag; // mineshaft
  VCount?: IntTag; // villages
  gendepth: IntTag;
  orientation: IntTag; // union of 4 cardinal directions? `255 (-1) | 0 | 1 | 2 | 3`
}

export interface LegacyMVillages {
  data: {
    Tick: IntTag;
    Villages: object[];
  };
}