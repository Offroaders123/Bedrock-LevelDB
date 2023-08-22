import { LevelDB } from "leveldb-zlib";
import { readLevel } from "../src/index.js";

const world = new URL("../test/My World/db/",import.meta.url);
const db = new LevelDB(decodeURI(world.pathname));

await db.open();

const data = await readLevel(db);
console.log(data);

await db.close();