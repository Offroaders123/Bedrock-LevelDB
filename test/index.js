// @ts-check

import levelup from "levelup";
import leveldown from "leveldown";
import encode from "encoding-down";

import { deflateSync, inflateSync } from "node:zlib";
import { read } from "../dist/index.js";

const demoPath = decodeURI(new URL("../test/My World/db/",import.meta.url).pathname);

const db = levelup(encode(leveldown(demoPath)),{
  encode: deflateSync,
  decode: inflateSync
});

await read(db);