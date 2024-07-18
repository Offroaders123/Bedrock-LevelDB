declare module "leveldb-zlib/js/leveldb.d.ts" {
  import type { Iterator } from "leveldb-zlib/js/iterator.d.ts";

  export class LevelDB {
    [Symbol.asyncIterator](): ReturnType<Iterator[typeof Symbol.asyncIterator]>;
  }
}

declare module "leveldb-zlib/js/iterator.d.ts" {
  export class Iterator {
    [Symbol.asyncIterator](): AsyncGenerator<[Buffer, Buffer], void, void>;
  }
}