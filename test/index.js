// @ts-check

import { LevelDB } from "leveldb-zlib";
import { read } from "../dist/index.js";

const db = new LevelDB(decodeURI(new URL("../test/My World/db/",import.meta.url).pathname));

await db.open();

const data = await read(db);
console.log(data);

await db.close();