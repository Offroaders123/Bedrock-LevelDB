import { read } from "nbtify";

import type { NBTData, ReadOptions, ByteTag, BooleanTag, IntTag, LongTag, FloatTag, StringTag, RootTagLike, ByteArrayTag, ShortTag } from "nbtify";

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
  const view = new DataView(key.buffer,key.byteOffset,key.byteLength);
  const stringy: string = key.toString("utf-8");

  switch (true){
    case actorprefix.test(stringy):
      return { type: "actorprefix", key } satisfies SuffixKey;

    case digp.test(stringy):
      return { type: "digp", key } satisfies SuffixKey;

    case posTrackDB.test(stringy):
      return { type: "posTrackDB", key } satisfies SuffixKey;

    case player.test(stringy):
      return { type: "player", key } satisfies SuffixKey;

    case player_server.test(stringy):
      return { type: "player_server", key } satisfies SuffixKey;

    case tickingarea.test(stringy):
      return { type: "tickingarea", key } satisfies SuffixKey;

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
  }
  // console.log(stringy);

  if (stringy in WORLD_KEY){
    return stringy as WorldKey;
  }

  // console.log(key)//,stringy);

  const x = view.getInt32(0,true);
  const y = view.getInt32(4,true);
  let dimension: Dimension = Dimension.overworld;
  try {
    dimension = view.getInt32(8,true);
  } catch {}
  const type = view.getUint8(dimension === Dimension.overworld ? 8 : 12);
  // console.log(CHUNK_KEY[type]);
  // console.log(Dimension[dimension],"\n");
  return { stringy, x, y, dimension, type: CHUNK_KEY[type]! as ChunkKey["type"] } satisfies ChunkKey;
}

export async function readValue(key: Key, value: Buffer): Promise<Value> {
  if (typeof key === "string"){
    switch (key as WorldKey){
      case "AutonomousEntities": return read<AutonomousEntities>(value,format);
      case "BiomeData": return read<BiomeData>(value,format);
      case "game_flatworldlayers": return value as GameFlatWorldLayers;
      case "PositionTrackDB-LastId": return read<PositionTrackDBLastId>(value,format);
      case "LevelChunkMetaDataDictionary": return value as LevelChunkMetaDataDictionary;
      case "~local_player": return read<LocalPlayer>(value,format);
      case "mobevents": return read<MobEvents>(value,format);
      case "Overworld": return read<Overworld>(value,format);
      case "Nether": return read<Nether>(value,format);
      case "TheEnd": return read<TheEnd>(value,format);
      case "portals": return read<Portals>(value,format);
      case "schedulerWT": return read<SchedulerWT>(value,format);
      case "scoreboard": return read<Scoreboard>(value,format);
      // default: return value;
    }
  } else {
    switch (key.type){
      // ChunkKey
      case "Data3D": return value as Data3D;
      case "Version": return value.readInt8() as Version;
      case "Data2D": return value as Data2D;
      case "Data2DLegacy": return value as Data2DLegacy;
      case "SubChunkPrefix": return value.readInt8() as SubChunkPrefix;
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

      // SuffixKey
      case "actorprefix": return read<ActorPrefix>(value,format);
      case "digp": return value as DigP;
      case "posTrackDB": return read<PosTrackDB>(value,format).then(data => { console.log(key.key.toString("utf-8"),data); return data; });
      case "player": return read<PlayerServerDef>(value,format).then(data => { console.log(key.key.toString("utf-8"),data); return data; });
      case "player_server": return read<PlayerServer>(value,format).then(data => { console.log(key.key.toString("utf-8"),data); return data; });
      case "VILLAGE_DWELLERS": return read<VillageDwellers>(value,format);
      case "VILLAGE_INFO": return read<VillageInfo>(value,format);
      case "VILLAGE_PLAYERS": return read<VillagePlayers>(value,format);
      case "VILLAGE_POI": return read<VillagePois>(value,format);
      case "map": return read<Map>(value,format);
      case "tickingarea": return read<TickingArea>(value,format);
      // default: return value;
      default: throw { key, value, nbt: await read(value,format) };
    }
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
      const message: string = (error as Error).message ?? `${error}`;
      const length: number = parseInt(message.slice(46));
      const entry: NBTData<T> = await read<T>(data,{ ...format, strict: false });
      entries.push(entry);
      data = data.subarray(length);
    }
  }

  return entries;
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
  "PositionTrackDB-LastId" = "PositionTrackDB-LastId",
  Overworld = "Overworld",
  Nether = "Nether",
  TheEnd = "TheEnd",
  mobevents = "mobevents",
  portals = "portals",
  schedulerWT = "schedulerWT",
  scoreboard = "scoreboard"
}

export interface WorldKeyNameMap {
  BiomeData: BiomeData;
  LevelChunkMetaDataDictionary: LevelChunkMetaDataDictionary;
  game_flatworldlayers: GameFlatWorldLayers;
  "~local_player": LocalPlayer;
  AutonomousEntities: AutonomousEntities;
  Overworld: Overworld;
  Nether: Nether;
  TheEnd: TheEnd;
  mobevents: MobEvents;
  portals: Portals;
  schedulerWT: SchedulerWT;
  scoreboard: Scoreboard;
}

export interface SuffixKey {
  type: keyof typeof SUFFIX_KEY;
  key: Buffer;
}

export enum SUFFIX_KEY {
  actorprefix = "actorprefix",
  digp = "digp",
  posTrackDB = "posTrackDB",
  player = "player",
  player_server = "player_server",
  tickingarea = "tickingarea",
  VILLAGE_DWELLERS = "VILLAGE_DWELLERS",
  VILLAGE_INFO = "VILLAGE_INFO",
  VILLAGE_PLAYERS = "VILLAGE_PLAYERS",
  VILLAGE_POI = "VILLAGE_POI",
  map = "map"
}

export interface SuffixKeyNameMap {
  actorprefix: ActorPrefix;
  digp: DigP;
  posTrackDB: PosTrackDB;
  player: PlayerServerDef;
  player_server: PlayerServer;
  tickingarea: TickingArea;
  VILLAGE_DWELLERS: VillageDwellers;
  VILLAGE_INFO: VillageInfo;
  VILLAGE_PLAYERS: VillagePlayers;
  VILLAGE_POI: VillagePois;
  map: Map;
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

export interface ChunkKey {
  x: number;
  y: number;
  type: keyof typeof CHUNK_KEY;
  dimension: Dimension;
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

export type Value = NBTData<AutonomousEntities> | NBTData<BiomeData> | GameFlatWorldLayers | LevelChunkMetaDataDictionary | NBTData<LocalPlayer> | NBTData<MobEvents> | NBTData<Overworld> | NBTData<SchedulerWT> | NBTData<Scoreboard> | Data3D | Version | Data2D | Data2DLegacy | SubChunkPrefix | LegacyTerrain | BlockEntities | Entities | PendingTicks | LegacyBlockExtraData | BiomeState | FinalizedState | ConversionData | BorderBlocks | HardcodedSpawners | RandomTicks | CheckSums | GenerationSeed | GeneratedPreCavesAndCliffsBlending | BlendingBiomeHeight | MetaDataHash | BlendingData | ActorDigestVersion | LegacyVersion | ActorPrefix | DigP | NBTData<VillageDwellers> | NBTData<VillageInfo> | NBTData<VillagePlayers> | NBTData<VillagePois> | NBTData<Map> | NBTData<Portals> | NBTData<Nether> | NBTData<TheEnd> | NBTData<TickingArea> | NBTData<PlayerServerDef> | NBTData<PlayerServer> | NBTData<PosTrackDB> | NBTData<PositionTrackDBLastId>;

// WorldKey

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

export type GameFlatWorldLayers = Buffer;

export type LevelChunkMetaDataDictionary = Buffer;

export interface LocalPlayer {
  [name: string]: never; // from Region-Types
}

export interface MobEvents {
  events_enabled: BooleanTag;
  "minecraft:ender_dragon_event": BooleanTag;
  "minecraft:pillager_patrols_event": BooleanTag;
  "minecraft:wandering_trader_event": BooleanTag;
}

export interface Overworld {
  [name: string]: never; // untyped atm
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

// ChunkKey

export type Data3D = Buffer;
export type Version = number;
export type Data2D = Buffer;
export type Data2DLegacy = Buffer;
export type SubChunkPrefix = number;
export type LegacyTerrain = Buffer;

export type BlockEntities = NBTData<BlockEntity>[];

export interface BlockEntity {
  [name: string]: never; // declared from Region-Types
}

export type Entities = NBTData<Entity>[];

export interface Entity {
  [name: string]: never; // declared from Region-Types
}

export type PendingTicks = NBTData<PendingTick>[];

export interface PendingTick {
  [name: string]: never; // untyped atm
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
  [name: string]: never; // untyped atm
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
  [name: string]: never; // untyped atm
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
  colors: ByteArrayTag;
  decorations: unknown[];
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
    LimboEntities: unknown[]; // `Entity[]`?
  };
}

export interface TheEnd {
  data: {
    DragonFight: DragonFight;
    LimboEntities: unknown[];
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
  [name: string]: unknown; // `Player` I'm pretty sure essentially, there might be more keys for server players than the plain `LocalPlayer` though.
}